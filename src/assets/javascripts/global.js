import { Application } from "@hotwired/stimulus";
import { Disclosure } from "./disclosure.js";
import { DisclosureGroup } from "./disclosure-group.js";

const app = Application.start();

app.register("disclosure", Disclosure);
app.register("disclosure-group", DisclosureGroup);
