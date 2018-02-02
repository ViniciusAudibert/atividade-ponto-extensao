const CWI_STORAGE = 'cwi-extension-storage'

const FORM_INPUT_NAME = 'credentialsCWI-form'
const USERNAME_INPUT_NAME = 'credentialsCWI-user'
const SENHA_INPUT_NAME = 'credentialsCWI-pass'
const CREEDENCIAL_INPUT_ID = 'credentialsCWI-pass'
const CWI_USERNAME_INPUT_ID = 'userName'
const CWI_SENHA_INPUT_NAME = 'pwd'
const CWI_SUBMIT_INPUT_NAME = 'Submit'
const CWI_JANELA_ERRO_INPUT_ID = 'error_box'
const MODAL_ID = 'credentialsCWI'
const MODAL_FECHAR_ID = 'credentialsCWI-close'
const MODAL_SUBMIT_ID = 'credentialsCWI-submit'

class Login {

    constructor() {
        this.init()
    }

    init() {
        const storage = localStorage.getItem(CWI_STORAGE)

        if (!storage) {
            this.exibirFormularioParaLogin()
        } else {
            this.fazerLogin(JSON.parse(this.descriptografar(storage)))
        }
    }

    fazerLogin(usuario) {
        this.aguardarObjetoCarregar(this.getFramesetDocument, 1000)
            .then(() => this.setInformacoesDoUsuario(usuario))
    }

    exibirFormularioParaLogin() {
        this.aguardarObjetoCarregar(this.getFramesetDocument, 1000)
            .then(() => this.adicionarHeader())
    }

    submitForm() {
        const form = this.getFramesetDocument().forms[FORM_INPUT_NAME]
        if (form) {
            const username = form[USERNAME_INPUT_NAME].value
            const senha = form[SENHA_INPUT_NAME].value

            if (username && senha) {
                const usuario = new User(username, senha)
                this.salvarUsuario(usuario)
                this.fazerLogin(usuario)
            } else {
                alert('Preencha todos os campos do formulário!')
            }
        }
    }

    setInformacoesDoUsuario(usuario) {
        const doc = this.getFramesetDocument()

        const usernameElement = doc.getElementById(CWI_USERNAME_INPUT_ID)
        const senhaElement = doc.getElementsByName(CWI_SENHA_INPUT_NAME)[0]

        if (!this.possuiAlgumErroEmTela() && usernameElement && senhaElement) {
            const submit = doc.getElementsByName(CWI_SUBMIT_INPUT_NAME)[0]

            usernameElement.value = usuario.username
            senhaElement.value = usuario.senha

            submit.click()
        } else {
            console.log('Não foi possivel achar os elementos do formulário')
        }
    }

    adicionarHeader() {
        this.requestArquivoInterno('login/loginSonicWallCss.html', 'GET')
            .then(response => {
                this.getFramesetDocument().head.innerHTML += response
                this.adicionarBody()
            })
            .catch(error => {
                console.log('Ops, não foi possivel adicionar o header:\n' + error)
            })
    }

    adicionarBody() {
        this.requestArquivoInterno('login/loginSonicWall.html', 'GET')
            .then(response => {
                this.getFramesetDocument().body.innerHTML += response
                this.iniciarModal()
            })
            .catch(error => {
                console.log('Ops, não foi possivel adicionar o body:\n' + error)
            })
    }

    iniciarModal() {
        const doc = this.getFramesetDocument()

        const elementoModal = doc.getElementById(MODAL_ID)
        const elementoFechar = doc.getElementById(MODAL_FECHAR_ID)
        const elementoSubmit = doc.getElementById(MODAL_SUBMIT_ID)

        elementoSubmit.addEventListener("click", () => this.submitForm(), false)

        elementoModal.style.display = "block"


        elementoFechar.onclick = () => {
            elementoModal.style.display = "none"
        }

        window.onclick = event => {
            if (event.target == elementoModal) {
                elementoModal.style.display = "none"
            }
        }
    }

    salvarUsuario(usuario) {
        const userEncript = this.encriptografar(JSON.stringify(usuario))
        localStorage.setItem(CWI_STORAGE, userEncript)
    }

    possuiAlgumErroEmTela() {
        const doc = this.getFramesetDocument()
        const erro = doc.getElementById(CWI_JANELA_ERRO_INPUT_ID)

        return erro && erro.style.visibility === 'visible'
    }

    encriptografar(texto) {
        const key = this.getEncKey()
        return Crypto.AES.encrypt(texto, key)
    }

    descriptografar(texto) {
        const key = this.getEncKey()
        return Crypto.AES.decrypt(texto, key)
    }

    getEncKey() {
        const key = new Array(32)
        for (let i = 0; i < 32; i++)
            key[i] = i * 4
        return key
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

    getFramesetDocument() {
        try {
            const dom = document.getElementsByTagName('frameset')[0]
            const childs = dom.children[0]

            return childs.contentWindow.document
        } catch (e) {
            return null
        }
    }
}

class User {
    constructor(username, senha) {
        this.username = username
        this.senha = senha
    }
}

new Login()