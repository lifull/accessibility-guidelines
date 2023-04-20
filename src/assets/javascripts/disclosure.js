import { Controller } from "@hotwired/stimulus";

export class Disclosure extends Controller {
  static targets = ["button", "content"];

  connect() {
    this.defaultHidden = this.contentTarget.hidden || true;
    this.checkHash();
  }

  toggle() {
    this.expanded ? this.collapse() : this.expand();
  }

  expand() {
    this.expanded = true;
  }

  collapse() {
    this.expanded = false;
  }

  checkHash() {
    const hash = decodeURIComponent(window.location.hash.slice(1));
    const target = document.getElementById(hash);
    if (this.element.contains(target)) {
      this.expand();
      target.focus();
    }
  }

  beforematch() {
    this.expand();
  }

  get expanded() {
    return !this.contentTarget.hidden;
  }

  set expanded(expanded) {
    this.buttonTarget.setAttribute("aria-expanded", String(expanded));
    this.contentTarget.hidden = expanded ? false : this.defaultHidden;
    this.dispatch("toggle", { bubbles: true, detail: expanded });
  }
}
