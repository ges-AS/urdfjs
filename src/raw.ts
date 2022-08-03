import { xml2json } from "xml-js"

export function parse_xml(xml_data: string): raw_json {
    return JSON.parse(xml2json(xml_data, {
        compact: true,
        ignoreComment: true
    }))
}

export function get_package_name(package_url: string) {
    return (package_url.split("/").pop() as string)
}

export interface raw_json {
    robot: {
        joint: raw_joint[]
        link: raw_link[]
        _attributes: {
            name: string
        }
    }
}

export interface raw_link {
    inertial?: {
        origin?: { _attributes: { xyz: string, rpy: string } }
        mass: { _attributes: { value: string } }
        inertia: {
            _attributes: {
                ixx: string
                ixy: string
                ixz: string
                iyy: string
                iyz: string
                izz: string
            }
        }
    },
    collision?: {
        origin?: { _attributes: { xyz: string, rpy: string } }
        geometry: raw_geomtry
        _attributes?: { name: string }
    },
    visual?: {
        origin?: { _attributes: { xyz: string, rpy: string } }
        geometry: raw_geomtry
        material?: {
            color?: { _attributes: { rgba: string } }
            texture?: { _attributes: { filename: string } }
            _attributes: { name: string }
        }
        _attributes?: { name: string }
    },
    _attributes: {
        name: string
    }
}

export interface raw_geomtry {
    box?: { _attributes: { size: string } }
    cylinder?: { _attributes: { radius: string, length: string } }
    sphere?: { _attributes: { radius: string } }
    mesh?: { _attributes: { filename: string, scale?: string } }
}

export interface raw_joint {
    axis?: { _attributes: { xyz: string } }
    calibration?: { _attributes: { rising?: string, falling?: string } }
    child: { _attributes: { link: string } }
    dynamics?: { _attributes: { damping?: string, friction?: string } }
    limit?: {
        _attributes: {
            effort: string,
            lower?: string,
            upper?: string,
            velocity: string
        }
    }
    mimic?: { _attributes: { joint: string, multiplier?: string, offset?: string } }
    safety_controller?: {
        _attributes: {
            soft_lower_limit?: string,
            soft_upper_limit?: string,
            k_position?: string,
            k_velocity: string
        }
    }
    origin?: { _attributes: { rpy: string, xyz: string } }
    parent: { _attributes: { link: string } }
    _attributes: {
        name: string,
        type: "revolute" | "continuous" | "prismatic" | "fixed" | "floating" | "planar"
    }
}