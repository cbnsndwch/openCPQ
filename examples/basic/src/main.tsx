import { createRoot } from "react-dom/client";
import {
    Root,
    CGroup,
    cmember,
    CString,
    CSelect,
    ccase,
    cdefault,
    CBoolean,
    CPanel,
    rootPath,
    Problems
} from "@cbnsndwch/opencpq";
import "@cbnsndwch/opencpq/styles.css";

// A small laptop configurator to exercise the library.
const LaptopType = CPanel(
    { header: "Laptop configuration" },
    CGroup([
        cmember("name", "Config name", CString({ defaultValue: "My laptop" })),
        cmember(
            "cpu",
            "CPU",
            CSelect([
                cdefault(ccase("i5", "Intel Core i5")),
                ccase("i7", "Intel Core i7"),
                ccase("i9", "Intel Core i9")
            ])
        ),
        cmember(
            "ram",
            "RAM",
            CSelect([
                ccase("8", "8 GB"),
                cdefault(ccase("16", "16 GB")),
                ccase("32", "32 GB"),
                ccase("64", "64 GB")
            ])
        ),
        cmember("touchscreen", "Touchscreen", CBoolean())
    ])
);

const container = document.getElementById("root");
if (container) {
    createRoot(container).render(
        <Root
            type={LaptopType}
            initialCtxProvider={() => ({
                path: rootPath,
                problems: new Problems()
            })}
        />
    );
}
