import { Controller } from "@hotwired/stimulus";

export class DisclosureGroup extends Controller {
	static targets = ["button"];
	static outlets = ["disclosure"];

	toggle() {
		const expanded = this.expanded;
		this.disclosureOutlets.forEach((disclosure) =>
			expanded ? disclosure.collapse() : disclosure.expand()
		);
	}

	update() {
		this.buttonTarget.setAttribute("aria-expanded", String(this.expanded));
	}

	get expanded() {
		return this.disclosureOutlets.every((disclosure) => disclosure.expanded);
	}
}
