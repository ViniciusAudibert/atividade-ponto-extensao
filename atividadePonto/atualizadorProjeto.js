class AtualizadorProjeto {

    constructor() {
        this.clientesEProjetos = []

        this.setConstantes()
        this.init()
    }

    setConstantes() {
        this.PROJETOS_ATUALIZADOS_MSG_KEY = 'projetos-atualizados-msg-key'

        this.ICONE_PREENCHIDO_FILENAME = 'register_activity.png'
        this.ICONE_NAO_PREENCHIDO_FILENAME = 'register_activity_notFilled.png'
        this.TABLE_HORARIOS_ID = 'tbcMain_tbpHorary_GridViewHorary'

        this.MODAL_IFRAME_ID = 'CWIModalPopup_CWIModalPopupIFrame'
        this.MODAL_CLIENTE_ID = 'FormViewActivity_ddlClients'
        this.MODAL_PROJETO_ID = 'FormViewActivity_ddlProjects'
        this.MODAL_CLOSE_BTN_ID = 'CWIModalPopup_CWIWindowBaseCloseButton'
    }

    init() {
        this.abrirModalAtividade()
        this.iniciarBuscaDosProjetos()
    }

    abrirModalAtividade() {
        const rows = document.getElementById(this.TABLE_HORARIOS_ID).tBodies[0].children
        for (let i = 0; i < rows.length; i++) {
            const iconeAtividadeInput = rows[i].cells[rows[i].cells.length - 1].children[0]

            if (iconeAtividadeInput.src.endsWith(this.ICONE_PREENCHIDO_FILENAME) || iconeAtividadeInput.src.endsWith(this.ICONE_NAO_PREENCHIDO_FILENAME)) {
                iconeAtividadeInput.click()
                break
            }
        }
    }

    iniciarBuscaDosProjetos() {
        this.aguardarObjetoCarregar(() => this.getModalDocument().getElementById(this.MODAL_CLIENTE_ID), 1000)
            .then(() => {
                const clientes = this.getModalDocument().getElementById(this.MODAL_CLIENTE_ID).children
                this.preencherListaDeClientesEProjetos(1, clientes)
            })
    }

    preencherListaDeClientesEProjetos(index, listClientesInput) {
        if (index < listClientesInput.length) {
            const nomeProjetoAnterior = this.getModalDocument().getElementById(this.MODAL_PROJETO_ID).textContent
            const clienteInput = this.getModalDocument().getElementById(this.MODAL_CLIENTE_ID)
            const nomeCliente = listClientesInput[index].textContent

            this.setInputNomeProjeto(clienteInput, nomeCliente)
            this.forcarEventoOnChangeNoElemento(clienteInput)

            this.aguardarObjetoCarregar(() => this.isProjetoInputCarregado(nomeProjetoAnterior), 1000)
                .then(() => {
                    this.adicionarNovoCliente(nomeCliente)
                    this.preencherListaDeClientesEProjetos(index + 1, listClientesInput)
                })
                .catch(() => this.preencherListaDeClientesEProjetos(index + 1, listClientesInput))
        } else {
            this.salvarClientesEFecharModal()
        }
    }

    isProjetoInputCarregado(nomeProjetoAnterior) {
        const projetoInput = this.getModalDocument().getElementById(this.MODAL_PROJETO_ID)
        return projetoInput.length > 1 && nomeProjetoAnterior !== projetoInput.textContent
    }

    adicionarNovoCliente(nomeCliente) {
        const listProjetosInput = this.getModalDocument().getElementById(this.MODAL_PROJETO_ID).children
        const listProjetoName = this.mapNomeDosProjetosFromInput(listProjetosInput)

        this.clientesEProjetos.push(new ClienteEProjetos(nomeCliente, listProjetoName))
    }

    salvarClientesEFecharModal() {
        chrome.runtime.sendMessage({
            msg: this.PROJETOS_ATUALIZADOS_MSG_KEY,
            data: this.clientesEProjetos
        });

        const btnFechar = document.getElementById(this.MODAL_CLOSE_BTN_ID)
        btnFechar.click()
    }

    forcarEventoOnChangeNoElemento(elemento) {
        if ('createEvent' in document) {
            const eventHtml = document.createEvent('HTMLEvents')
            eventHtml.initEvent('change', false, true)
            elemento.dispatchEvent(eventHtml)
        } else {
            elemento.fireEvent('onchange')
        }
    }

    setInputNomeProjeto(inputClientes, nomeCliente) {
        const opcoes = inputClientes.children
        for (let i = 0; i < opcoes.length; i++) {
            const opcao = opcoes[i]

            if (opcao.text.toLocaleLowerCase() === nomeCliente.toLocaleLowerCase()) {
                inputClientes.value = opcao.value
            }
        }
    }

    aguardarObjetoCarregar(callbackIsLoaded, tempo) {
        let tentativasDeCarregamento = 0
        return new Promise((resolve, reject) => {
            const interval = setInterval(() => {
                if (callbackIsLoaded()) {
                    clearInterval(interval)
                    resolve()
                } else if (tentativasDeCarregamento > 3) {
                    clearInterval(interval)
                    reject()
                }
                tentativasDeCarregamento++
            }, tempo)
        })
    }

    getModalDocument() {
        try {
            return document.getElementById(this.MODAL_IFRAME_ID).contentWindow.document
        } catch (e) {
            return undefined
        }
    }

    mapNomeDosProjetosFromInput(inputElement) {
        let projectArray = []

        for (let i = 0; i < inputElement.length; i++) {
            projectArray.push(inputElement[i].textContent)
        }

        return projectArray
    }
}

class ClienteEProjetos {
    constructor(cliente, projetos) {
        this.cliente = cliente
        this.projetos = projetos
    }
}

new AtualizadorProjeto()