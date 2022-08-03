import { mat3, mat4, quat, vec3 } from "gl-matrix";
import { get_package_name, parse_xml } from "./raw";
export function parse_urdf(urdf, package_url) {
    return parse_raw_json(parse_xml(urdf), package_url);
}
export function parse_raw_json(json, urdf_package_url) {
    let res = {
        name: json.robot._attributes.name,
        links: [],
        joints: []
    };
    for (let i = 0; i < json.robot.link.length; i++) {
        const raw_link = json.robot.link[i];
        res.links.push(parse_link(raw_link, urdf_package_url));
    }
    for (let i = 0; i < json.robot.joint.length; i++) {
        const raw_joint = json.robot.joint[i];
        res.joints.push(parse_joint(raw_joint));
    }
    return res;
}
function parse_link(raw_link, urdf_package_url) {
    let l = {
        name: raw_link._attributes.name,
    };
    if (raw_link.inertial) {
        l.inertial = {
            origin: mat4.create(),
            mass: 0,
            inertia: mat3.create()
        };
        // mass
        l.inertial.mass = Number(raw_link.inertial.mass._attributes.value);
        // origin
        if (raw_link.inertial.origin) {
            l.inertial.origin = parse_origin(raw_link.inertial.origin);
        }
        // inertia
        let ixx = Number(raw_link.inertial.inertia._attributes.ixx);
        let ixy = Number(raw_link.inertial.inertia._attributes.ixy);
        let ixz = Number(raw_link.inertial.inertia._attributes.ixz);
        let iyy = Number(raw_link.inertial.inertia._attributes.iyy);
        let iyz = Number(raw_link.inertial.inertia._attributes.iyz);
        let izz = Number(raw_link.inertial.inertia._attributes.izz);
        l.inertial.inertia = mat3.fromValues(ixx, ixy, ixz, ixy, iyy, iyz, ixz, iyz, izz);
    }
    if (raw_link.visual) {
        l.visual = {
            origin: mat4.create(),
            geometry: {
                radius: 0
            }
        };
        // name
        if (raw_link.visual._attributes) {
            l.visual.name = raw_link.visual._attributes.name;
        }
        // origin
        if (raw_link.visual.origin) {
            l.visual.origin = parse_origin(raw_link.visual.origin);
        }
        // geometry
        l.visual.geometry = parse_geometry(raw_link.visual.geometry, urdf_package_url);
        // material
        if (raw_link.visual.material) {
            l.visual.material = {
                name: raw_link.visual.material._attributes.name
            };
            if (raw_link.visual.material.color) {
                l.visual.material.color = {
                    rgba: raw_link.visual.material.color._attributes.rgba.split(" ").map(s => Number(s))
                };
            }
            if (raw_link.visual.material.texture) {
                l.visual.material.texture = {
                    filename: parse_filename(raw_link.visual.material.texture._attributes.filename, urdf_package_url)
                };
            }
        }
    }
    if (raw_link.collision) {
        l.collision = {
            origin: mat4.create(),
            geometry: {
                radius: 0
            }
        };
        // origin
        if (raw_link.collision.origin) {
            l.collision.origin = parse_origin(raw_link.collision.origin);
        }
        // name
        if (raw_link.collision._attributes) {
            l.collision.name = raw_link.collision._attributes.name;
        }
        // geometry
        l.collision.geometry = parse_geometry(raw_link.collision.geometry, urdf_package_url);
    }
    return l;
}
function parse_geometry(raw_geomtry, package_url) {
    // let 
    if (raw_geomtry.box) {
        return {
            size: raw_geomtry.box._attributes.size.split(" ").map(s => Number(s))
        };
    }
    else if (raw_geomtry.cylinder) {
        return {
            radius: Number(raw_geomtry.cylinder._attributes.radius),
            length: Number(raw_geomtry.cylinder._attributes.length)
        };
    }
    else if (raw_geomtry.mesh) {
        let scale = [1, 1, 1];
        if (raw_geomtry.mesh._attributes.scale) {
            scale = raw_geomtry.mesh._attributes.scale.split(" ").map(s => Number(s));
        }
        return {
            filename: parse_filename(raw_geomtry.mesh._attributes.filename, package_url),
            scale: scale
        };
    }
    else if (raw_geomtry.sphere) {
        return {
            radius: Number(raw_geomtry.sphere._attributes.radius)
        };
    }
    else {
        return {
            radius: 0
        };
    }
}
function parse_filename(filename, package_url) {
    return filename.replace("package://" + get_package_name(package_url), package_url);
}
function parse_origin(origin) {
    let out = mat4.create();
    let rpy = origin._attributes.rpy.split(" ").map(s => Number(s));
    let xyz = origin._attributes.xyz.split(" ").map(s => Number(s));
    xyz_rpy_to_mat4(out, xyz, rpy);
    return out;
}
function xyz_rpy_to_mat4(out, xyz, rpy) {
    let q = quat.create();
    quat.fromEuler(q, rpy[0], rpy[1], rpy[2]);
    mat4.fromRotationTranslation(out, q, vec3.fromValues(xyz[0], xyz[1], xyz[2]));
}
function parse_joint(raw_joint) {
    let j = {
        name: raw_joint._attributes.name,
        type: raw_joint._attributes.type,
        origin: mat4.create(),
        parent: raw_joint.parent._attributes.link,
        child: raw_joint.child._attributes.link,
        axis: [1, 0, 0],
        dynamics: {
            damping: 0,
            friction: 0
        },
        limit: {
            lower: 0,
            upper: 0,
            effort: 0,
            velocity: 0
        }
    };
    if (raw_joint.origin) {
        j.origin = parse_origin(raw_joint.origin);
    }
    if (raw_joint.axis) {
        j.axis = raw_joint.axis._attributes.xyz.split(" ").map(s => Number(s));
    }
    if (raw_joint.calibration) {
        j.calibration = {};
        if (raw_joint.calibration._attributes.rising)
            j.calibration.rising = Number(raw_joint.calibration._attributes.rising);
        if (raw_joint.calibration._attributes.falling)
            j.calibration.falling = Number(raw_joint.calibration._attributes.falling);
    }
    if (raw_joint.dynamics) {
        j.dynamics = {
            damping: Number(raw_joint.dynamics._attributes.damping) | 0,
            friction: Number(raw_joint.dynamics._attributes.friction) | 0
        };
    }
    if (raw_joint.limit) {
        j.limit = {
            lower: Number(raw_joint.limit._attributes.lower) | 0,
            upper: Number(raw_joint.limit._attributes.upper) | 0,
            effort: Number(raw_joint.limit._attributes.effort),
            velocity: Number(raw_joint.limit._attributes.velocity)
        };
    }
    if (raw_joint.mimic) {
        j.mimic = {
            joint: raw_joint.mimic._attributes.joint,
            multiplier: Number(raw_joint.mimic._attributes.multiplier) | 1,
            offset: Number(raw_joint.mimic._attributes.offset) | 0
        };
    }
    if (raw_joint.safety_controller) {
        j.safety_controller = {
            soft_lower_limit: Number(raw_joint.safety_controller._attributes.soft_lower_limit) | 0,
            soft_upper_limit: Number(raw_joint.safety_controller._attributes.soft_upper_limit) | 0,
            k_position: Number(raw_joint.safety_controller._attributes.k_position) | 0,
            k_velocity: Number(raw_joint.safety_controller._attributes.k_velocity),
        };
    }
    return j;
}
