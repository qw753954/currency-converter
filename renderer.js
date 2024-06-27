let nowCurrency = 'TWD', nowData = null, favList = []

const selects = document.querySelectorAll('select')
const inputs = document.querySelectorAll('input[type="number"]')
const addBtn = document.querySelector('#addBtn')
const showBtn = document.querySelector('#showBtn')
const swapBtn = document.querySelector('#swapBtn')
const favModalEl = document.querySelector('#favModal')
const favModal = new bootstrap.Modal(favModalEl)

const fileActions = {
  read: async (fileName) => {
    return new Promise(resolve => {
      ipcRenderer.send('readFile', fileName)
      ipcRenderer.once('readComplete', (event, content) => {
        resolve(JSON.parse(content) || [])
      })
    })
  },
  write: async (fileName, content) => {
    return new Promise(resolve => {
      ipcRenderer.send('writeFile', fileName, content)
      ipcRenderer.on('writeComplete', (event, res) => {
        resolve()
      })
    })
  }
}

async function fetchCurrency(currency) {
  nowCurrency = currency
  try {
    const apiPath = `https://v6.exchangerate-api.com/v6/67855d4fd9fca51238a162cd/latest/${currency}`;
    const res = await fetch(apiPath)
    const json = await res.json()
    return json.conversion_rates
  } catch (err) {
    console.log(`Error: ${err}`);
  }
}

async function render() {
  function calculate(doller) {
    const rate = nowData[compared.currency()]
    return doller * rate
  }
  const now = {
    input: inputs[0],
    getDoller: function () {
      return this.input.value
    },
    select: selects[0],
    currency: function () {
      return this.select.value
    },
  }
  const compared = {
    input: inputs[1],
    select: selects[1],
    currency: function () {
      return this.select.value
    },
  }
  if (nowCurrency !== now.currency()) {
    nowData = await fetchCurrency(now.currency())
  }

  compared.input.value = calculate(now.getDoller())
}

function removeFav(index) {
  favList.splice(index, 1)
  renderFavList()
}

function goToFav(index) {
  const data = favList[index]
  selects[0].value = data[0]
  selects[1].value = data[1]
  inputs[0].value = ''
  inputs[1].value = ''
  favModal.hide()
}

function enableTootlip() {
  const tooltips = document.querySelectorAll("[data-bs-toggle='tooltip']")

  for (let item of tooltips) {
    const tooltip = new bootstrap.Tooltip(item)
    item.addEventListener('shown.bs.tooltip', () => {
      item.addEventListener('click', () => {
        tooltip.hide()
      })
    })
  }
}

inputs.forEach((input, index) => {
  input.addEventListener('input', () => {
    render(index)
  })
})

selects.forEach((select, index) => {
  select.addEventListener('change', () => {
    if (inputs[index].value) render(index)
  })
})

addBtn.addEventListener('click', () => {
  favList.push([...selects].map(i => i.value))
  fileActions.write('fav.txt', favList)
  generateToast('已加入我的最愛')
})

function renderFavList() {
  const list = favModalEl.querySelector('.modal-body ul')
  list.innerHTML = favList.map((i, index) => {
    return `<li class="row gx-0 justify-content-center align-items-center position-relative ${index !== 0 ? ' mt-4' : ''}">
              <div class="col text-center">
                ${i[0]} <i class="fs-3 bi bi-arrow-left-right align-middle px-5"></i> ${i[1]}
              </div>
              <div class="col-auto">
                <button
                  type="button"
                  onclick="goToFav(${index})"
                  data-bs-toggle="tooltip" data-bs-placement="top"
                  data-bs-title="前往"
                  class="bi bi-arrow-90deg-left btn btn-sm btn-light"
                  style="height: 30px;"
                ></button>
                <button
                  type="button"
                  onclick="removeFav(${index})"
                  data-bs-toggle="tooltip" data-bs-placement="top"
                  data-bs-title="移除"
                  class="bi bi-trash3 btn btn-light text-danger btn-sm ms-2"
                  style="height: 30px;"
                ></button>
              </div>
            </li>`
  }).join('') || '<li class="h-100 d-flex align-items-center justify-content-center">暫無</li>'

  enableTootlip()
  favModal.show()
}

function generateToast(text) {
  const html = `
  <div class="toast show mt-2" role="alert" aria-live="assertive" aria-atomic="true">
    <div class="d-flex align-items-center justify-content-center px-2">
      <div class="toast-body me-auto">${text}</div>
      <button type="button" class="btn-close mx-3" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  </div>
  `
  const toast = document.createElement('div')
  toast.innerHTML = html
  document.querySelector('.toast-container').appendChild(toast)

  setTimeout(() => {
    toast.remove()
  }, 3000)
}

showBtn.addEventListener('click', async () => {
  const content = await fileActions.read('fav.txt')
  favList = content
  renderFavList()
})

swapBtn.addEventListener('click', () => {
  const tmp = {
    now: selects[0].value,
    compared: selects[1].value,
  }
  selects[0].value = tmp.compared
  selects[1].value = tmp.now

  render()
})

favModalEl.addEventListener('hidden.bs.modal', event => {
  fileActions.write('fav.txt', favList)
})

const init = async function () {
  nowData = await fetchCurrency(nowCurrency)
  for (let item of selects) {
    item.innerHTML = Object.keys(nowData).map(i => `<option value="${i}">${i}</option>`).join('')
  }

  enableTootlip()
}()