export function openModal(modal: HTMLElement) {
	modal
		.querySelector<HTMLButtonElement>(".modal-close")
		?.addEventListener("click", onCloseClick);
	modal.classList.add("-in");
	window.getComputedStyle(modal).opacity;
	modal.classList.add("-active");
}

export function closeModal(modal: HTMLElement) {
	modal.addEventListener("transitionend", onTranstionEnd);
	modal.classList.add("-out");
	modal.classList.remove("-active");
}

function onCloseClick(event: MouseEvent) {
	event.preventDefault();
	let target = event.target as HTMLElement | null;
	let modal = target?.closest<HTMLElement>(".modal.-active");
	if (modal != null) {
		closeModal(modal);
	}
}

function onTranstionEnd(event: TransitionEvent) {
	let target = event.target as HTMLElement | null;
	if (!target) {
		// ???
		return;
	}
	target.classList.remove("-out");
	target.removeEventListener("transitionend", onTranstionEnd);
}
