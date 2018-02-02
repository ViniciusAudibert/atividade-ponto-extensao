class AtividadePontoPopup {
    constructor() {
        this.projetos = []

        this.binds()
        this.setConstantes()
        this.init()
    }

    binds() {
        this.onMessageAtualizarProjetos = this.onMessageAtualizarProjetos.bind(this)
    }

    setConstantes() {
        this.PROJETOS_ATUALIZADOS_MSG_KEY = 'projetos-atualizados-msg-key'
        this.LOCAL_STORAGE_PROJETOS = 'local-storage-projetos'

        this.NOME_CLIENTE_ID = 'atividade-ponto_cliente'
        this.NOME_PROJETO_ID = 'atividade-ponto_projeto'
        this.DESCRICAO_ID = 'atividade-ponto_descricao'
        this.DATA_INICIO_ID = 'atividade-ponto_data-inicial'
        this.DATA_FIM_ID = 'atividade-ponto_data-final'
        this.BTN_SUBMIT_ID = 'atividade-ponto_submit'
        this.BTN_ATUALIZAR_PROJETOS_ID = 'atividade-ponto_atualizar-projetos'

        this.CAMINHO_BASE = 'atividadePonto'
        this.CAMINHO_LISTA_PROJETOS = `${this.CAMINHO_BASE}/listaProjeto.txt`
        this.CAMINHO_ATIVIDADE_PONTO = `${this.CAMINHO_BASE}/atividadePonto.js`
        this.CAMINHO_ATUALIZAR_PROJETOS = `${this.CAMINHO_BASE}/atualizadorProjeto.js`
    }

    init() {
        new Pikaday({
            field: document.getElementById(this.DATA_INICIO_ID)
        })
        new Pikaday({
            field: document.getElementById(this.DATA_FIM_ID)
        })

        this.iniciarMessageListener()
        this.carregarProjetos()
    }

    iniciarMessageListener() {
        const self = this
        chrome.runtime.onMessage.addListener(
            (request, sender, sendResponse) => {
                if (request.msg === this.PROJETOS_ATUALIZADOS_MSG_KEY) {
                    self.onMessageAtualizarProjetos(request.data)
                }
            }
        );
    }

    onMessageAtualizarProjetos(clientesEProjetos) {
        window.close()
        localStorage.setItem(this.LOCAL_STORAGE_PROJETOS, JSON.stringify(clientesEProjetos))

    }

    carregarProjetos() {
        const listProjeto = localStorage.getItem(this.LOCAL_STORAGE_PROJETOS)

        if (!!listProjeto) {
            this.projetos = JSON.parse(listProjeto)
            this.carregarClientes()
        } else {
            this.requestArquivoInterno(this.CAMINHO_LISTA_PROJETOS, 'GET')
                .then(response => {
                    localStorage.setItem(this.LOCAL_STORAGE_PROJETOS, response)
                    this.projetos = JSON.parse(response)
                    this.carregarClientes()
                })
                .catch(error => {
                    console.log('Erro ao buscar arquivo lista de projeto\n' + error)
                })
        }
    }

    carregarClientes() {
        let clienteInput = document.getElementById(this.NOME_CLIENTE_ID)
        clienteInput.onchange = event => this.clienteOnChange(event)

        this.projetos.forEach(element => {
            let option = document.createElement('option')

            option.value = element.cliente
            option.textContent = element.cliente

            clienteInput.add(option)
        })

        this.adicionarEventosDaModal()
    }

    adicionarEventosDaModal() {
        const btnSubmit = document.getElementById(this.BTN_SUBMIT_ID)
        btnSubmit.addEventListener('click', () => this.submitForm(), false)

        const btnAtualizarProjetos = document.getElementById(this.BTN_ATUALIZAR_PROJETOS_ID)
        btnAtualizarProjetos.addEventListener('click', () => this.atualizarProjetos(), false)
    }

    submitForm() {
        const pontoModel = this.getAtividadePontoModel()

        if (pontoModel.isValido()) {
            this.executarJsFileInterno(this.CAMINHO_ATIVIDADE_PONTO, `const pontoModel =  ${JSON.stringify(pontoModel)}`)
        } else {
            alert('Preencha todo o formulário!')
        }
    }

    atualizarProjetos() {
        this.executarJsFileInterno(this.CAMINHO_ATUALIZAR_PROJETOS)
    }

    executarJsFileInterno(caminho, codigoParametro) {
        chrome.windows.getCurrent(currentWindow => {
            chrome.tabs.query({
                active: true,
                windowId: currentWindow.id
            }, activeTabs => {
                activeTabs.map(tab => {
                    chrome.tabs.executeScript(tab.id, {
                            code: codigoParametro
                        },
                        () => {
                            chrome.tabs.executeScript(tab.id, {
                                file: caminho,
                                allFrames: false
                            })
                        })
                })
            })
        })
    }

    getAtividadePontoModel() {
        return new AtividadePontoModel({
            nomeCliente: document.getElementById(this.NOME_CLIENTE_ID).value,
            nomeProjeto: document.getElementById(this.NOME_PROJETO_ID).value,
            descricaoAtividade: document.getElementById(this.DESCRICAO_ID).value,
            dataInicio: document.getElementById(this.DATA_INICIO_ID).value,
            dataFim: document.getElementById(this.DATA_FIM_ID).value,
        })
    }

    clienteOnChange(event) {
        const cliente = this.projetos.find(projeto => projeto.cliente === event.target.value)

        if (cliente) {
            const projetoInput = document.getElementById(this.NOME_PROJETO_ID)

            while (projetoInput.firstChild) {
                projetoInput.removeChild(projetoInput.firstChild)
            }

            cliente.projetos.forEach(element => {
                let option = document.createElement('option')

                option.value = element
                option.textContent = element

                projetoInput.add(option)
            })
        } else {
            console.log(`Nenhum projeto encontrado para cliente "${event.target.value}"`)
        }
    }

    requestArquivoInterno(url, type) {
        return new Promise((resolve, reject) => {
            const xhttp = new XMLHttpRequest()

            xhttp.onreadystatechange = response => {
                if (xhttp.readyState == XMLHttpRequest.DONE) {
                    if (xhttp.status == 200) {
                        resolve(response.target.responseText)
                    } else {
                        reject(response.target)
                    }
                }
            }
            xhttp.open(type, this.getPluginUrl(url), true)
            xhttp.send()
        })
    }

    getPluginUrl(fileName) {
        return chrome.extension.getURL(fileName)
    }
}

class AtividadePontoModel {
    constructor(opcoes) {
        this.nomeCliente = opcoes.nomeCliente
        this.nomeProjeto = opcoes.nomeProjeto
        this.descricaoAtividade = opcoes.descricaoAtividade
        this.dataInicio = opcoes.dataInicio
        this.dataFim = opcoes.dataFim
    }

    isValido() {
        return !!this.nomeCliente &&
            !!this.nomeProjeto &&
            !!this.descricaoAtividade &&
            !!this.dataInicio &&
            !!this.dataFim
    }
}

new AtividadePontoPopup()