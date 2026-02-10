
// ============================================================
// ФАЙЛ: src/domManager.js
// ============================================================

class DOMManager {
    constructor() {
        this.elements = {};
    }

    addElement(key, element) {
        this.elements[key] = element;
        return element;
    }

    getElement(key) {
        return this.elements[key];
    }

    appendToBody(element) {
        document.body.appendChild(element);
        return element;
    }

    insertAfter(newElement, referenceElement) {
        referenceElement.parentNode.insertBefore(newElement, referenceElement.nextSibling);
    }

    appendChild(parent, child) {
        parent.appendChild(child);
    }
}

