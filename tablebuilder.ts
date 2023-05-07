/**
 * @param id {string}
 * @param numRows {number}
 * @param numColumns {number}
 */
export function constructTable(
	id: string,
	numRows: number,
	numColumns: number,
	content: string = "0",
	type: string = "ram",
) {
	let createElement = document.createElement.bind(document);
	let table = document.getElementById(id);
	if (!table) {
		throw new Error(`Invalid selector #${id}!`);
	}
	let tbody = table.querySelector("tbody");
	for (let i = 0; i < numRows; i++) {
		let tr = createElement("tr");
		tr.id = `${type}-row-${i}`;
		for (let j = 0; j < numColumns; j++) {
			let td = createElement("td");
			td.textContent = content;
			td.id = `${type}-cell-${i * numColumns + j}`;
			td.classList.add(`${type}-cell`);
			tr.appendChild(td);
		}
		tbody!.appendChild(tr);
	}
}
