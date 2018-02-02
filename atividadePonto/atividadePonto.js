const TABLE_HORARIOS_ID = 'tbcMain_tbpHorary_GridViewHorary'

const ICONE_PREENCHIDO_FILENAME = 'register_activity.png'
const ICONE_NAO_PREENCHIDO_FILENAME = 'register_activity_notFilled.png'

const MODAL_IFRAME_ID = 'CWIModalPopup_CWIModalPopupIFrame'
const MODAL_CLIENTE_ID = 'FormViewActivity_ddlClients'
const MODAL_PROJETO_ID = 'FormViewActivity_ddlProjects'
const MODAL_DESCRICAO_ID = 'FormViewActivity_txtDescription'
const MODAL_HORAS_TRABALHADAS_ID = 'FormViewActivity_lblWorkedHours'
const MODAL_HORAS_INPUT_ID = 'FormViewActivity_txtSpentTime'
const MODAL_SAVE_BTN_ID = 'ActionButtonSave1'
const MODAL_CLOSE_BTN_ID = 'CWIModalPopup_CWIWindowBaseCloseButton'

class AtividadePontoPopup {

    constructor(nomeCliente, nomeProjeto, descricaoAtividade, dataInicio, dataFim) {
        this.nomeCliente = nomeCliente
        this.nomeProjeto = nomeProjeto
        this.descricaoAtividade = descricaoAtividade
        this.dataInicio = new Date(dataInicio)
        this.dataFim = new Date(dataFim)

        this.iniciarPreenchimentoDasAtividades(0)
    }

    iniciarPreenchimentoDasAtividades(index) {
        const rows = document.getElementById(TABLE_HORARIOS_ID).tBodies[0].children
        this.preencherItensSemAtividades(index, rows)
    }

    preencherItensSemAtividades(index, rows) {
        if (rows.length > index) {
            const cells = rows[index].cells
            const input = cells[cells.length - 1].children[0]


            const inputData = cells[1].children[0].textContent.split('/')
            const dataFormatada = new Date(inputData[1] + '/' + inputData[0] + '/' + inputData[2])

            if (this.isDataValida(dataFormatada) && this.isInputNaoPreenchido(input)) {
                input.click()

                this.preencherCliente()
            } else {
                this.preencherItensSemAtividades(index + 1, rows)
            }
        }
    }

    preencherCliente() {
        this.aguardarObjetoCarregar(() => this.getModalDocument().getElementById(MODAL_CLIENTE_ID), 1000)
            .then(() => {
                const clienteInput = this.getModalDocument().getElementById(MODAL_CLIENTE_ID)

                this.setInputNomeProjeto(clienteInput)
                this.forcarEventoOnChangeNoElemento(clienteInput)
                this.setHorasTrabalhadas()
                this.setAtividadeDescricao()

                this.aguardarObjetoCarregar(() => this.getModalDocument().getElementById(MODAL_PROJETO_ID).length > 1, 1000)
                    .then(() => {
                        this.setInputNomeProjeto(this.getModalDocument().getElementById(MODAL_PROJETO_ID))
                        this.salvarEFecharModal()

                        this.aguardarObjetoCarregar(() => document.getElementById(input.id).src.endsWith(ICONE_PREENCHIDO_FILENAME), 1000)
                            .then(() => this.iniciarPreenchimentoDasAtividades(index + 1))
                    })
            })
    }

    salvarEFecharModal() {
        const save = this.getModalDocument().getElementById(MODAL_SAVE_BTN_ID)
        save.click()

        const closeBtn = document.getElementById(MODAL_CLOSE_BTN_ID)
        closeBtn.click()
    }

    setHorasTrabalhadas() {
        const horasTrabalhadas = this.getModalDocument().getElementById(MODAL_HORAS_TRABALHADAS_ID)
        const horasInput = this.getModalDocument().getElementById(MODAL_HORAS_INPUT_ID)

        horasInput.value = horasTrabalhadas.textContent
    }

    setAtividadeDescricao() {
        const descricaoInput = this.getModalDocument().getElementById(MODAL_DESCRICAO_ID)
        descricaoInput.value = this.descricaoAtividade
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

    isDataValida(data) {
        return data >= this.dataInicio && data <= this.dataFim
    }

    isInputNaoPreenchido(input) {
        return input.src && input.src.endsWith(ICONE_NAO_PREENCHIDO_FILENAME)
    }

    setInputNomeProjeto(inputClientes) {
        const opcoes = inputClientes.children
        for (let i = 0; i < opcoes.length; i++) {
            const opcao = opcoes[i]

            if (opcao.text.toLocaleLowerCase() === this.nomeCliente.toLocaleLowerCase()) {
                inputClientes.value = opcao.value
            }
        }
    }

    aguardarObjetoCarregar(callbackIsLoaded, tempo) {
        return new Promise((resolve, reject) => {
            const interval = setInterval(() => {
                if (callbackIsLoaded()) {
                    clearInterval(interval)
                    resolve()
                }
            }, tempo)
        })
    }

    getModalDocument() {
        try {
            return document.getElementById(MODAL_IFRAME_ID).contentWindow.document
        } catch (e) {
            return undefined
        }
    }
}

document.onload = new AtividadePontoPopup(pontoModel.nomeCliente, pontoModel.nomeProjeto, pontoModel.descricaoAtividade, pontoModel.dataInicio, pontoModel.dataFim)