// handle menu bar dynamics

// get all the buttons
const similarAreaButton = document.querySelector('.find-similar-area');
const dataExplorerButton = document.querySelector('.data-explorer');
const documentationButton = document.querySelector('.documentation');

const menuBlock = document.querySelector('.menu-block');


// get all divs
const similarAreaDiv = document.querySelector('#find-similar-area-body');
const dataExplorerDiv = document.querySelector('#data-explorer-body');
const documentationDiv = document.querySelector('#documentation-body');

// get footer div
const footer = document.querySelector('.footer');


const menuAll = [similarAreaDiv, dataExplorerDiv, documentationDiv];

// create a function to handle menu bar situation

function handleMenuDisplay(select) {
  for (const item of menuAll) {
    if (item != select) {
      item.style.display = 'none';
    }
  }
  // different div has different display method
  select == similarAreaDiv ? select.style.display = 'flex' : select.style.display = 'block';
}

function handleFooter(select) {
  select == documentationDiv ? footer.style.display = 'none' : footer.style.display = 'block';
}

function manipulateMenu(select, width) {
  menuBlock.style.left = width;
  handleMenuDisplay(select);
  handleFooter(select);
}

function handleMenuBar() {
  similarAreaButton.addEventListener('click', () => {
    manipulateMenu(similarAreaDiv, 0);
  });

  dataExplorerButton.addEventListener('click', () => {
    manipulateMenu(dataExplorerDiv, '130px');
  });

  documentationButton.addEventListener('click', () => {
    manipulateMenu(documentationDiv, '260px');
  });
}

export {
  handleMenuBar,
};
