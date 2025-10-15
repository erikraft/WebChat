// login elements
const login = document.querySelector(".login")
const loginForm = login.querySelector(".login__form")
const loginInput = login.querySelector(".login__input")

// chat elements
const chat = document.querySelector(".chat")
const chatForm = chat.querySelector(".chat__form")
const chatInput = chat.querySelector(".chat__input")
const formatButtons = chat.querySelectorAll(".format-button")
const embedInput = chat.querySelector(".chat__embed-input")
const embedButton = chat.querySelector(".chat__embed-button")
const embedPreview = chat.querySelector(".chat__embed-preview")

const EMBED_PREVIEW_EMPTY = `<p class="chat__embed-preview--empty">Cole um link compatível para gerar uma pré-visualização interativa.</p>`

if (embedPreview) embedPreview.innerHTML = EMBED_PREVIEW_EMPTY
const chatMessages = chat.querySelector(".chat__messages")

const colors = [
    "cadetblue",
    "darkgoldenrod",
    "cornflowerblue",
    "darkkhaki",
    "hotpink",
    "gold"
]

const user = { id: "", name: "", color: "" }

let websocket

const createMessageSelfElement = (content) => {
    const div = document.createElement("div")

    div.classList.add("message--self")
    div.innerHTML = content

    return div
}

const createMessageOtherElement = (content, sender, senderColor) => {
    const div = document.createElement("div")
    const span = document.createElement("span")

    div.classList.add("message--other")

    span.classList.add("message--sender")
    span.style.color = senderColor

    div.appendChild(span)

    span.innerHTML = sender
    div.innerHTML += content

    return div
}

const getRandomColor = () => {
    const randomIndex = Math.floor(Math.random() * colors.length)
    return colors[randomIndex]
}

const scrollScreen = () => {
    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
    })
}

const processMessage = ({ data }) => {
    const { userId, userName, userColor, content } = JSON.parse(data)

    const message =
        userId == user.id
            ? createMessageSelfElement(content)
            : createMessageOtherElement(content, userName, userColor)

    chatMessages.appendChild(message)

    scrollScreen()
}

const handleLogin = (event) => {
    event.preventDefault()

    user.id = crypto.randomUUID()
    user.name = loginInput.value
    user.color = getRandomColor()

    login.style.display = "none"
    chat.style.display = "flex"

    websocket = new WebSocket("wss://webchat-backend-b23r.onrender.com")
    websocket.onmessage = processMessage
}

const sendMessage = (event) => {
    event.preventDefault()

    const message = {
        userId: user.id,
        userName: user.name,
        userColor: user.color,
        content: chatInput.value.trim()
    }

    if (!message.content) return

    websocket.send(JSON.stringify(message))

    chatInput.value = ""
    if (embedPreview) embedPreview.innerHTML = EMBED_PREVIEW_EMPTY
    if (embedInput) embedInput.value = ""
}

loginForm.addEventListener("submit", handleLogin)
chatForm.addEventListener("submit", sendMessage)

const wrapSelection = (prefix = "", suffix = "", placeholder = "") => {
    const { selectionStart, selectionEnd, value } = chatInput
    const hasSelection = selectionStart !== selectionEnd

    if (hasSelection) {
        const selected = value.slice(selectionStart, selectionEnd)
        const newValue =
            value.slice(0, selectionStart) +
            prefix +
            selected +
            suffix +
            value.slice(selectionEnd)

        chatInput.value = newValue
        chatInput.focus()
        chatInput.selectionStart = selectionStart + prefix.length
        chatInput.selectionEnd = selectionEnd + prefix.length
    } else {
        const insertText = prefix + placeholder + suffix
        const newCursor = selectionStart + prefix.length + placeholder.length

        chatInput.value =
            value.slice(0, selectionStart) + insertText + value.slice(selectionEnd)

        chatInput.focus()
        chatInput.selectionStart = newCursor
        chatInput.selectionEnd = newCursor
    }
}

const handleMention = () => {
    const username = prompt("Qual @usuario você deseja mencionar?")
    if (!username) return

    const sanitized = username.trim().replace(/^@+/, "")
    if (!sanitized) return

    wrapSelection(`@${sanitized} `, "")
}

const buildEmbedMarkup = (rawUrl) => {
    let parsedUrl

    try {
        parsedUrl = new URL(rawUrl)
    } catch (error) {
        return null
    }

    const host = parsedUrl.hostname.replace(/^www\./, "")

    const createIframe = (src, title = "Conteúdo incorporado") =>
        `<iframe src="${src}" title="${title}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`

    if (host.includes("youtube.com") || host === "youtu.be") {
        const videoId = parsedUrl.searchParams.get("v") || parsedUrl.pathname.replace(/^\//, "")
        if (!videoId) return null
        const embedUrl = `https://www.youtube.com/embed/${videoId}`
        return createIframe(embedUrl, "Vídeo do YouTube")
    }

    if (host.includes("instagram.com")) {
        const path = parsedUrl.pathname.endsWith("/") ? parsedUrl.pathname : `${parsedUrl.pathname}/`
        return createIframe(`https://www.instagram.com${path}embed/`, "Publicação do Instagram")
    }

    if (host.includes("threads.net")) {
        return createIframe(`${parsedUrl.href}?embed=1`, "Publicação do Threads")
    }

    if (host.includes("x.com") || host.includes("twitter.com")) {
        return createIframe(`https://twitframe.com/show?url=${encodeURIComponent(parsedUrl.href)}`, "Post do Twitter/X")
    }

    if (host.includes("bsky.app")) {
        return createIframe(`https://embed.bsky.app/embed?url=${encodeURIComponent(parsedUrl.href)}`, "Post do Bluesky")
    }

    if (host.includes("mastodon")) {
        return createIframe(`${parsedUrl.origin}/embed?url=${encodeURIComponent(parsedUrl.href)}`, "Post do Mastodon")
    }

    return createIframe(parsedUrl.href, "Conteúdo compartilhado")
}

formatButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const { prefix = "", suffix = "", action, placeholder = "" } = button.dataset

        if (action === "mention") {
            handleMention()
            return
        }

        wrapSelection(prefix, suffix, placeholder)
    })
})

if (embedButton) {
    embedButton.addEventListener("click", () => {
        if (!embedPreview || !embedInput) return

        const url = embedInput.value.trim()
        if (!url) {
            embedPreview.innerHTML = EMBED_PREVIEW_EMPTY
            return
        }

        const iframeMarkup = buildEmbedMarkup(url)

        if (!iframeMarkup) {
            embedPreview.innerHTML = `<p class="chat__embed-preview--empty">Não foi possível gerar um iFrame para esse link. Verifique a URL e tente novamente.</p>`
            return
        }

        const separator = chatInput.value ? "\n\n" : ""
        chatInput.value = `${chatInput.value}${separator}${iframeMarkup}`
        embedPreview.innerHTML = iframeMarkup
        embedInput.value = ""
    })
}
