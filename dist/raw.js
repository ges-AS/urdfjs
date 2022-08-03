import { xml2json } from "xml-js";
export function parse_xml(xml_data) {
    return JSON.parse(xml2json(xml_data, {
        compact: true,
        ignoreComment: true
    }));
}
export function get_package_name(package_url) {
    return package_url.split("/").pop();
}
