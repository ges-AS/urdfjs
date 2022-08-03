import { mat3, mat4, quat, vec3 } from "gl-matrix";
import { get_package_name, raw_json, raw_link, raw_joint, raw_geomtry, parse_xml } from "./raw"

export interface parse_option {
    package_replace_url?: string
    use_matrix?: boolean
}

export function parse_urdf(urdf: string, parse_option?: parse_option): Robot {
    let _parse_option = parse_option || {};
    return parse_raw_json(parse_xml(urdf), _parse_option.use_matrix || false, _parse_option.package_replace_url);
}

export function parse_raw_json(json: raw_json, use_matrix: boolean, urdf_package_url?: string): Robot {
    let res: Robot = {
        name: json.robot._attributes.name,
        links: [],
        joints: []
    }

    for (let i = 0; i < json.robot.link.length; i++) {
        const raw_link = json.robot.link[i];
        res.links.push(parse_link(raw_link, use_matrix, urdf_package_url));
    }
    for (let i = 0; i < json.robot.joint.length; i++) {
        const raw_joint = json.robot.joint[i];
        res.joints.push(parse_joint(raw_joint, use_matrix));
    }
    return res
}

function parse_link(raw_link: raw_link, use_matrix: boolean, urdf_package_url?: string): Link {
    let l: Link = {
        name: raw_link._attributes.name,
    }
    if (raw_link.inertial) {
        l.inertial = {
            origin: use_matrix ? mat4.create() : { xyz: [0, 0, 0], rpy: [0, 0, 0] },
            mass: 0,
            inertia: mat3.create()
        }
        // mass
        l.inertial.mass = Number(raw_link.inertial.mass._attributes.value);

        // origin
        if (raw_link.inertial.origin) {
            l.inertial.origin = parse_origin(raw_link.inertial.origin, use_matrix)
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
            origin: use_matrix ? mat4.create() : { xyz: [0, 0, 0], rpy: [0, 0, 0] },
            geometry: {
                radius: 0
            }
        }
        // name
        if (raw_link.visual._attributes) {
            l.visual.name = raw_link.visual._attributes.name
        }

        // origin
        if (raw_link.visual.origin) {
            l.visual.origin = parse_origin(raw_link.visual.origin, use_matrix);
        }
        // geometry
        l.visual.geometry = parse_geometry(raw_link.visual.geometry, urdf_package_url);

        // material
        if (raw_link.visual.material) {
            l.visual.material = {
                name: raw_link.visual.material._attributes.name
            }
            if (raw_link.visual.material.color) {
                l.visual.material.color = {
                    rgba: raw_link.visual.material.color._attributes.rgba.split(" ").map(s => Number(s))
                }
            }

            if (raw_link.visual.material.texture) {
                l.visual.material.texture = {
                    filename: parse_filename(raw_link.visual.material.texture._attributes.filename, urdf_package_url)
                }
            }
        }
    }
    if (raw_link.collision) {
        l.collision = {
            origin: use_matrix ? mat4.create() : { xyz: [0, 0, 0], rpy: [0, 0, 0] },
            geometry: {
                radius: 0
            }
        }
        // origin
        if (raw_link.collision.origin) {
            l.collision.origin = parse_origin(raw_link.collision.origin, use_matrix);
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

function parse_geometry(raw_geomtry: raw_geomtry, package_url?: string): box | cylinder | sphere | mesh {
    // let 
    if (raw_geomtry.box) {
        return {
            size: raw_geomtry.box._attributes.size.split(" ").map(s => Number(s))
        }
    } else if (raw_geomtry.cylinder) {
        return {
            radius: Number(raw_geomtry.cylinder._attributes.radius),
            length: Number(raw_geomtry.cylinder._attributes.length)
        }
    } else if (raw_geomtry.mesh) {
        let scale = [1, 1, 1];
        if (raw_geomtry.mesh._attributes.scale) {
            scale = raw_geomtry.mesh._attributes.scale.split(" ").map(s => Number(s))
        }
        return {
            filename: parse_filename(raw_geomtry.mesh._attributes.filename, package_url),
            scale: scale
        }
    } else if (raw_geomtry.sphere) {
        return {
            radius: Number(raw_geomtry.sphere._attributes.radius)
        }
    } else {
        return {
            radius: 0
        }
    }
}

function parse_filename(filename: string, package_url?: string) {
    if (package_url) {
        return filename.replace("package://" + get_package_name(package_url), package_url)
    } else {
        return filename
    }
}

function parse_origin(origin: { _attributes: { rpy: string, xyz: string } }, use_matrix: boolean = false) {
    let rpy = origin._attributes.rpy.split(" ").map(s => Number(s));
    let xyz = origin._attributes.xyz.split(" ").map(s => Number(s));
    if (use_matrix) {
        let out = mat4.create();
        xyz_rpy_to_mat4(out, xyz, rpy);
        return out
    } else {
        return {
            xyz, rpy
        }
    }
}

function xyz_rpy_to_mat4(out: mat4, xyz: number[], rpy: number[]) {
    let q = quat.create();
    quat.fromEuler(q, rpy[0], rpy[1], rpy[2]);
    mat4.fromRotationTranslation(out, q, vec3.fromValues(xyz[0], xyz[1], xyz[2]));
}

function parse_joint(raw_joint: raw_joint, use_matrix: boolean): Joint {
    let j: Joint = {
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
    }
    if (raw_joint.origin) {
        j.origin = parse_origin(raw_joint.origin, use_matrix);
    }
    if (raw_joint.axis) {
        j.axis = raw_joint.axis._attributes.xyz.split(" ").map(s => Number(s));
    }
    if (raw_joint.calibration) {
        j.calibration = {}
        if (raw_joint.calibration._attributes.rising) j.calibration.rising = Number(raw_joint.calibration._attributes.rising);
        if (raw_joint.calibration._attributes.falling) j.calibration.falling = Number(raw_joint.calibration._attributes.falling);
    }
    if (raw_joint.dynamics) {
        j.dynamics = {
            damping: Number(raw_joint.dynamics._attributes.damping) | 0,
            friction: Number(raw_joint.dynamics._attributes.friction) | 0
        }
    }
    if (raw_joint.limit) {
        j.limit = {
            lower: Number(raw_joint.limit._attributes.lower) | 0,
            upper: Number(raw_joint.limit._attributes.upper) | 0,
            effort: Number(raw_joint.limit._attributes.effort),
            velocity: Number(raw_joint.limit._attributes.velocity)
        }
    }
    if (raw_joint.mimic) {
        j.mimic = {
            joint: raw_joint.mimic._attributes.joint,
            multiplier: Number(raw_joint.mimic._attributes.multiplier) | 1,
            offset: Number(raw_joint.mimic._attributes.offset) | 0
        }
    }
    if (raw_joint.safety_controller) {
        j.safety_controller = {
            soft_lower_limit: Number(raw_joint.safety_controller._attributes.soft_lower_limit) | 0,
            soft_upper_limit: Number(raw_joint.safety_controller._attributes.soft_upper_limit) | 0,
            k_position: Number(raw_joint.safety_controller._attributes.k_position) | 0,
            k_velocity: Number(raw_joint.safety_controller._attributes.k_velocity),
        }
    }
    return j;
}

export interface Robot {
    name: string,
    links: Link[]
    joints: Joint[]
}

export interface Link {
    name: string
    inertial?: {
        origin: mat4 | { xyz: number[], rpy: number[] }
        mass: number
        inertia: mat3
    }
    visual?: {
        name?: string
        origin: mat4 | { xyz: number[], rpy: number[] }
        geometry: box | cylinder | sphere | mesh
        material?: {
            name: string
            color?: {
                rgba: number[]
            }
            texture?: {
                filename: string
            }
        }
    }
    collision?: {
        name?: string
        origin: mat4 | { xyz: number[], rpy: number[] }
        geometry: box | cylinder | sphere | mesh
    }
}

export interface box {
    // size attribute contains the three side lengths of the box. 
    // The origin of the box is in its center.
    size: number[]
}
export interface cylinder {
    radius: number
    length: number
}
export interface sphere {
    radius: number
}
export interface mesh {
    filename: string
    scale: number[]
}

export interface Joint {
    name: string
    type: "revolute" | "continuous" | "prismatic" | "fixed" | "floating" | "planar"
    origin: mat4 | { xyz: number[], rpy: number[] }
    parent: string
    child: string
    // (x,y,z) default to be 1 0 0
    axis: number[]
    calibration?: {
        rising?: number
        falling?: number
    }
    dynamics?: {
        // default to be 0
        damping: number
        // default to be 0
        friction: number
    }
    limit: {
        // default to be 0
        lower: number
        // default to be 0
        upper: number
        effort: number
        velocity: number
    }
    // value = multiplier * other_joint_value + offset.
    mimic?: {
        joint: string
        multiplier: number
        offset: number
    }

    safety_controller?: {
        soft_lower_limit: number
        soft_upper_limit: number
        k_position: number
        k_velocity: number
    }
}