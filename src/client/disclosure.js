import { Controller } from "@hotwired/stimulus";

export class Disclosure extends Controller {
	static targets = ["button", "content"];

	toggle() {
		this.expanded ? this.collapse() : this.expand();
	}

	expand() {
		this.expanded = true;
	}

	collapse() {
		this.expanded = false;
	}

	get expanded() {
		return !this.contentTarget.hidden;
	}

	set expanded(expanded) {
		this.buttonTarget.setAttribute("aria-expanded", String(expanded));
		this.contentTarget.hidden = expanded ? false : "until-found";
	}
}
