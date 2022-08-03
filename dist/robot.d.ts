import { mat3, mat4 } from "gl-matrix";
import { raw_json } from "./raw";
export declare function parse_urdf(urdf: string, package_url: string): Robot;
export declare function parse_raw_json(json: raw_json, urdf_package_url: string): Robot;
export interface Robot {
    name: string;
    links: Link[];
    joints: Joint[];
}
export interface Link {
    name: string;
    inertial?: {
        origin: mat4;
        mass: number;
        inertia: mat3;
    };
    visual?: {
        name?: string;
        origin: mat4;
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
        origin: mat4;
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
    origin: mat4;
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
