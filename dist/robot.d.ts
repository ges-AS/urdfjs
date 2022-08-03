import { mat3, mat4 } from "gl-matrix";
import { raw_json } from "./raw";
export interface parse_option {
    package_replace_url?: string;
    use_matrix?: boolean;
}
export declare function parse_urdf(urdf: string, parse_option?: parse_option): Robot;
export declare function parse_raw_json(json: raw_json, use_matrix: boolean, urdf_package_url?: string): Robot;
export interface Robot {
    name: string;
    links: Link[];
    joints: Joint[];
}
export interface Link {
    name: string;
    inertial?: {
        origin: mat4 | {
            xyz: number[];
            rpy: number[];
        };
        mass: number;
        inertia: mat3;
    };
    visual?: {
        name?: string;
        origin: mat4 | {
            xyz: number[];
            rpy: number[];
        };
        geometry: box | cylinder | sphere | mesh;
        material?: {
            name: string;
            color?: {
                rgba: number[];
            };
            texture?: {
                filename: string;
            };
        };
    };
    collision?: {
        name?: string;
        origin: mat4 | {
            xyz: number[];
            rpy: number[];
        };
        geometry: box | cylinder | sphere | mesh;
    };
}
export interface box {
    size: number[];
}
export interface cylinder {
    radius: number;
    length: number;
}
export interface sphere {
    radius: number;
}
export interface mesh {
    filename: string;
    scale: number[];
}
export interface Joint {
    name: string;
    type: "revolute" | "continuous" | "prismatic" | "fixed" | "floating" | "planar";
    origin: mat4 | {
        xyz: number[];
        rpy: number[];
    };
    parent: string;
    child: string;
    axis: number[];
    calibration?: {
        rising?: number;
        falling?: number;
    };
    dynamics?: {
        damping: number;
        friction: number;
    };
    limit: {
        lower: number;
        upper: number;
        effort: number;
        velocity: number;
    };
    mimic?: {
        joint: string;
        multiplier: number;
        offset: number;
    };
    safety_controller?: {
        soft_lower_limit: number;
        soft_upper_limit: number;
        k_position: number;
        k_velocity: number;
    };
}
