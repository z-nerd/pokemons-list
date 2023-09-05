// To parse this data:
//
//   import { Convert, PokemonSpecies } from "./file";
//
//   const pokemonSpecies = Convert.toPokemonSpecies(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface PokemonSpecies {
    base_happiness:         number;
    capture_rate:           number;
    color:                  Color;
    egg_groups:             Color[];
    evolution_chain:        EvolutionChain;
    evolves_from_species:   Color;
    flavor_text_entries:    FlavorTextEntry[];
    form_descriptions:      any[];
    forms_switchable:       boolean;
    gender_rate:            number;
    genera:                 Genus[];
    generation:             Color;
    growth_rate:            Color;
    habitat:                Color;
    has_gender_differences: boolean;
    hatch_counter:          number;
    id:                     number;
    is_baby:                boolean;
    is_legendary:           boolean;
    is_mythical:            boolean;
    name:                   string;
    names:                  Name[];
    order:                  number;
    pal_park_encounters:    PalParkEncounter[];
    pokedex_numbers:        PokedexNumber[];
    shape:                  Color;
    varieties:              Variety[];
}

export interface Color {
    name: string;
    url:  string;
}

export interface EvolutionChain {
    url: string;
}

export interface FlavorTextEntry {
    flavor_text: string;
    language:    Color;
    version:     Color;
}

export interface Genus {
    genus:    string;
    language: Color;
}

export interface Name {
    language: Color;
    name:     string;
}

export interface PalParkEncounter {
    area:       Color;
    base_score: number;
    rate:       number;
}

export interface PokedexNumber {
    entry_number: number;
    pokedex:      Color;
}

export interface Variety {
    is_default: boolean;
    pokemon:    Color;
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toPokemonSpecies(json: string): PokemonSpecies {
        return cast(JSON.parse(json), r("PokemonSpecies"));
    }

    public static pokemonSpeciesToJson(value: PokemonSpecies): string {
        return JSON.stringify(uncast(value, r("PokemonSpecies")), null, 2);
    }
}

function invalidValue(typ: any, val: any, key: any, parent: any = ''): never {
    const prettyTyp = prettyTypeName(typ);
    const parentText = parent ? ` on ${parent}` : '';
    const keyText = key ? ` for key "${key}"` : '';
    throw Error(`Invalid value${keyText}${parentText}. Expected ${prettyTyp} but got ${JSON.stringify(val)}`);
}

function prettyTypeName(typ: any): string {
    if (Array.isArray(typ)) {
        if (typ.length === 2 && typ[0] === undefined) {
            return `an optional ${prettyTypeName(typ[1])}`;
        } else {
            return `one of [${typ.map(a => { return prettyTypeName(a); }).join(", ")}]`;
        }
    } else if (typeof typ === "object" && typ.literal !== undefined) {
        return typ.literal;
    } else {
        return typeof typ;
    }
}

function jsonToJSProps(typ: any): any {
    if (typ.jsonToJS === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
    if (typ.jsToJSON === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = '', parent: any = ''): any {
    function transformPrimitive(typ: string, val: any): any {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val, key, parent);
    }

    function transformUnion(typs: any[], val: any): any {
        // val must validate against one typ in typs
        const l = typs.length;
        for (let i = 0; i < l; i++) {
            const typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) {}
        }
        return invalidValue(typs, val, key, parent);
    }

    function transformEnum(cases: string[], val: any): any {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases.map(a => { return l(a); }), val, key, parent);
    }

    function transformArray(typ: any, val: any): any {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue(l("array"), val, key, parent);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(val: any): any {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue(l("Date"), val, key, parent);
        }
        return d;
    }

    function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue(l(ref || "object"), val, key, parent);
        }
        const result: any = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps, key, ref);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps, key, ref);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val, key, parent);
    }
    if (typ === false) return invalidValue(typ, val, key, parent);
    let ref: any = undefined;
    while (typeof typ === "object" && typ.ref !== undefined) {
        ref = typ.ref;
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems")    ? transformArray(typ.arrayItems, val)
            : typ.hasOwnProperty("props")         ? transformObject(getProps(typ), typ.additional, val)
            : invalidValue(typ, val, key, parent);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== "number") return transformDate(val);
    return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
    return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
    return transform(val, typ, jsToJSONProps);
}

function l(typ: any) {
    return { literal: typ };
}

function a(typ: any) {
    return { arrayItems: typ };
}

function u(...typs: any[]) {
    return { unionMembers: typs };
}

function o(props: any[], additional: any) {
    return { props, additional };
}

function m(additional: any) {
    return { props: [], additional };
}

function r(name: string) {
    return { ref: name };
}

const typeMap: any = {
    "PokemonSpecies": o([
        { json: "base_happiness", js: "base_happiness", typ: 0 },
        { json: "capture_rate", js: "capture_rate", typ: 0 },
        { json: "color", js: "color", typ: r("Color") },
        { json: "egg_groups", js: "egg_groups", typ: a(r("Color")) },
        { json: "evolution_chain", js: "evolution_chain", typ: r("EvolutionChain") },
        { json: "evolves_from_species", js: "evolves_from_species", typ: r("Color") },
        { json: "flavor_text_entries", js: "flavor_text_entries", typ: a(r("FlavorTextEntry")) },
        { json: "form_descriptions", js: "form_descriptions", typ: a("any") },
        { json: "forms_switchable", js: "forms_switchable", typ: true },
        { json: "gender_rate", js: "gender_rate", typ: 0 },
        { json: "genera", js: "genera", typ: a(r("Genus")) },
        { json: "generation", js: "generation", typ: r("Color") },
        { json: "growth_rate", js: "growth_rate", typ: r("Color") },
        { json: "habitat", js: "habitat", typ: r("Color") },
        { json: "has_gender_differences", js: "has_gender_differences", typ: true },
        { json: "hatch_counter", js: "hatch_counter", typ: 0 },
        { json: "id", js: "id", typ: 0 },
        { json: "is_baby", js: "is_baby", typ: true },
        { json: "is_legendary", js: "is_legendary", typ: true },
        { json: "is_mythical", js: "is_mythical", typ: true },
        { json: "name", js: "name", typ: "" },
        { json: "names", js: "names", typ: a(r("Name")) },
        { json: "order", js: "order", typ: 0 },
        { json: "pal_park_encounters", js: "pal_park_encounters", typ: a(r("PalParkEncounter")) },
        { json: "pokedex_numbers", js: "pokedex_numbers", typ: a(r("PokedexNumber")) },
        { json: "shape", js: "shape", typ: r("Color") },
        { json: "varieties", js: "varieties", typ: a(r("Variety")) },
    ], false),
    "Color": o([
        { json: "name", js: "name", typ: "" },
        { json: "url", js: "url", typ: "" },
    ], false),
    "EvolutionChain": o([
        { json: "url", js: "url", typ: "" },
    ], false),
    "FlavorTextEntry": o([
        { json: "flavor_text", js: "flavor_text", typ: "" },
        { json: "language", js: "language", typ: r("Color") },
        { json: "version", js: "version", typ: r("Color") },
    ], false),
    "Genus": o([
        { json: "genus", js: "genus", typ: "" },
        { json: "language", js: "language", typ: r("Color") },
    ], false),
    "Name": o([
        { json: "language", js: "language", typ: r("Color") },
        { json: "name", js: "name", typ: "" },
    ], false),
    "PalParkEncounter": o([
        { json: "area", js: "area", typ: r("Color") },
        { json: "base_score", js: "base_score", typ: 0 },
        { json: "rate", js: "rate", typ: 0 },
    ], false),
    "PokedexNumber": o([
        { json: "entry_number", js: "entry_number", typ: 0 },
        { json: "pokedex", js: "pokedex", typ: r("Color") },
    ], false),
    "Variety": o([
        { json: "is_default", js: "is_default", typ: true },
        { json: "pokemon", js: "pokemon", typ: r("Color") },
    ], false),
};
