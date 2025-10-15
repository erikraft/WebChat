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
const mentionSuggestions = chat.querySelector(".chat__mention-suggestions")
const presenceToggle = chat.querySelector(".chat__presence-toggle")
const presencePanel = chat.querySelector(".chat__presence-panel")
const presenceList = chat.querySelector(".chat__presence-list")
const embedButton = chat.querySelector(".chat__embed-button")
const embedPreview = chat.querySelector(".chat__embed-preview")
const advancedToggle = chat.querySelector(".chat__advanced-toggle")
const advancedPanel = chat.querySelector(".chat__advanced")
const embedCloseButton = chat.querySelector(".chat__embed-close")
const profileNetworkSelect = chat.querySelector(".chat__profile-network")
const profileUrlInput = chat.querySelector(".chat__profile-url")
const profileAddButton = chat.querySelector(".chat__profile-add")
const profilePreviewList = chat.querySelector(".chat__profile-preview-list")
const profileInsertButton = chat.querySelector(".chat__profile-insert")
const profileClearButton = chat.querySelector(".chat__profile-clear")
const profileShareSection = chat.querySelector(".chat__profile-share")
const profileCloseButton = chat.querySelector(".chat__profile-close")

const EMBED_PREVIEW_EMPTY = `<p class="chat__embed-preview--empty">Cole um link compatível para gerar uma pré-visualização interativa.</p>`

const SOCIAL_NETWORKS = {
    discord: {
        label: "Discord",
        className: "mp-social-discord",
        icon: "https://logo.erikraft.com/social/Discord_White.svg"
    },
    youtube: {
        label: "YouTube",
        className: "mp-social-youtube",
        icon: "https://logo.erikraft.com/social/YouTube_White.svg"
    },
    instagram: {
        label: "Instagram",
        className: "mp-social-instagram",
        icon: "https://logo.erikraft.com/social/Instagram_White.svg"
    },
    threads: {
        label: "Threads",
        className: "mp-social-threads",
        icon: "https://logo.erikraft.com/social/Threads_White.svg"
    },
    twitter: {
        label: "Twitter (X)",
        className: "mp-social-twitter",
        icon: "https://logo.erikraft.com/social/Twitter_X_White.svg"
    },
    bluesky: {
        label: "Bluesky",
        className: "mp-social-bluesky",
        icon: "https://logo.erikraft.com/social/Bluesky_White.svg"
    },
    poe: {
        label: "Poe.com",
        className: "mp-social-poe",
        icon: "https://logo.erikraft.com/social/Poe_White_and_Colored.svg"
    }
}

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
const knownUsers = new Set()
const onlineUsers = new Map()
const originalTitle = document.title
const titleState = { hasUnread: false, mentionFrom: null }

let websocket
let mentionState = null
let mentionOptions = []
let mentionActiveIndex = -1

const createMessageSelfElement = (content) => {
    const div = document.createElement("div")

    div.classList.add("message--self")
    div.innerHTML = processFormatting(content)

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
    div.innerHTML += processFormatting(content)

    return div
}

const getRandomColor = () => {
    const randomIndex = Math.floor(Math.random() * colors.length)
    return colors[randomIndex]
}

const processFormatting = (text) => {
    if (!text) return text
    
    // Escape HTML to prevent XSS
    let processed = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
    
    // Process formatting in order of priority
    // Spoiler: ||text||
    processed = processed.replace(/\|\|(.+?)\|\|/g, '<span class="spoiler">$1</span>')
    
    // Highlight: ==text==
    processed = processed.replace(/==(.+?)==/g, '<mark>$1</mark>')
    
    // Bold: **text**
    processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    
    // Italic: *text*
    processed = processed.replace(/\*(.+?)\*/g, '<em>$1</em>')
    
    // Underline: __text__
    processed = processed.replace(/__(.+?)__/g, '<u>$1</u>')
    
    // Strikethrough: ~~text~~
    processed = processed.replace(/~~(.+?)~~/g, '<s>$1</s>')
    
    // Quote: > text (at start of line)
    processed = processed.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
    
    // Mentions: @username
    processed = processed.replace(/@(\w+)/g, '<span class="mention">@$1</span>')
    
    // Preserve line breaks
    processed = processed.replace(/\n/g, '<br>')
    
    return processed
}

const scrollScreen = () => {
    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
    })
}

const updateMentionOptions = () => {
    mentionOptions = Array.from(onlineUsers.keys()).sort((a, b) =>
        a.localeCompare(b, "pt-BR", { sensitivity: "base" })
    )
}

const updatePresenceList = () => {
    if (!presenceList) return

    const entries = Array.from(onlineUsers.keys()).sort((a, b) =>
        a.localeCompare(b, "pt-BR", { sensitivity: "base" })
    )

    presenceList.innerHTML = ""

    if (!entries.length) {
        const empty = document.createElement("li")
        empty.className = "chat__presence-item chat__presence-item--empty"
        empty.textContent = "Ninguém online ainda."
        presenceList.appendChild(empty)
        return
    }

    entries.forEach((name) => {
        const item = document.createElement("li")
        item.className = "chat__presence-item"

        const dot = document.createElement("span")
        dot.className = "chat__presence-dot"

        const label = document.createElement("span")
        label.textContent = name === user.name ? `${name} (você)` : name

        item.append(dot, label)
        presenceList.appendChild(item)
    })
}

const registerOnlineUser = (name, color = "") => {
    if (!name) return

    const wasNew = !onlineUsers.has(name)

    knownUsers.add(name)
    onlineUsers.set(name, color)

    if (wasNew) {
        updateMentionOptions()
    }
    updatePresenceList()
}

const unregisterOnlineUser = (name) => {
    if (!name) return

    onlineUsers.delete(name)
    updateMentionOptions()
    updatePresenceList()
}

const escapeRegExp = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const hideMentionSuggestions = () => {
    if (!mentionSuggestions) return

    mentionSuggestions.innerHTML = ""
    mentionSuggestions.setAttribute("hidden", "")
    mentionState = null
    mentionActiveIndex = -1
}

const highlightMentionOption = () => {
    if (!mentionSuggestions) return

    const children = Array.from(mentionSuggestions.children)

    children.forEach((child, index) => {
        if (index === mentionActiveIndex) {
            child.setAttribute("aria-selected", "true")
        } else {
            child.setAttribute("aria-selected", "false")
        }
    })
}

const getMentionContext = () => {
    if (!chatInput) return null

    const cursor = chatInput.selectionStart
    const text = chatInput.value

    let index = cursor - 1
    while (index >= 0) {
        const char = text[index]

        if (char === "@") {
            const beforeChar = index === 0 ? " " : text[index - 1]
            if (index > 0 && !/\s/.test(beforeChar) && beforeChar !== "\n") {
                return null
            }

            const term = text.slice(index + 1, cursor)
            if (!/^[-_.\p{L}\d]*$/u.test(term)) return null

            return { start: index, term }
        }

        if (!/^[-_.\p{L}\d]$/u.test(char)) {
            return null
        }

        index -= 1
    }

    return null
}

const showMentionSuggestions = (options, context) => {
    if (!mentionSuggestions) return

    mentionSuggestions.innerHTML = ""

    options.forEach((name, index) => {
        const button = document.createElement("button")
        button.type = "button"
        button.className = "chat__mention-item"
        button.setAttribute("role", "option")
        button.tabIndex = -1
        button.dataset.name = name
        button.textContent = name

        if (name === user.name) {
            const badge = document.createElement("span")
            badge.className = "chat__mention-badge"
            badge.textContent = "você"
            button.appendChild(badge)
        }

        button.setAttribute("aria-selected", index === mentionActiveIndex ? "true" : "false")
        mentionSuggestions.appendChild(button)
    })

    mentionSuggestions.removeAttribute("hidden")
    mentionState = { ...context, cursor: chatInput ? chatInput.selectionStart : 0 }
    requestAnimationFrame(() => highlightMentionOption())
}

const updateMentionSuggestions = () => {
    if (!mentionSuggestions) return

    const context = getMentionContext()
    if (!context) {
        hideMentionSuggestions()
        return
    }

    if (!mentionOptions.length) {
        hideMentionSuggestions()
        return
    }

    const normalizedTerm = context.term.toLocaleLowerCase("pt-BR")
    const filtered = mentionOptions.filter((name) =>
        normalizedTerm ? name.toLocaleLowerCase("pt-BR").startsWith(normalizedTerm) : true
    )

    if (!filtered.length) {
        hideMentionSuggestions()
        return
    }

    mentionActiveIndex = 0
    showMentionSuggestions(filtered, context)
}

const getMentionRange = () => {
    if (!chatInput || !mentionState) return null

    const start = mentionState.start
    const cursor = chatInput.selectionStart
    const end = Math.max(cursor, mentionState.start + 1 + (mentionState.term?.length || 0))

    return { start, end }
}

const applyMentionSelection = (name) => {
    if (!chatInput || !mentionState) return

    const range = getMentionRange()
    if (!range) return

    const { start, end } = range
    const before = chatInput.value.slice(0, start)
    const after = chatInput.value.slice(end)
    const insertion = `@${name} `

    chatInput.value = `${before}${insertion}${after}`
    const newCursor = before.length + insertion.length
    chatInput.focus()
    chatInput.selectionStart = newCursor
    chatInput.selectionEnd = newCursor

    hideMentionSuggestions()
}

const insertMentionTrigger = () => {
    if (!chatInput) return

    chatInput.focus()
    const { selectionStart, selectionEnd, value } = chatInput
    const before = value.slice(0, selectionStart)
    const after = value.slice(selectionEnd)
    const needsSpace = before.length && !/\s/.test(before.slice(-1))
    const insertion = `${needsSpace ? " " : ""}@`

    chatInput.value = `${before}${insertion}${after}`

    const newCursor = before.length + insertion.length
    chatInput.selectionStart = newCursor
    chatInput.selectionEnd = newCursor

    updateMentionSuggestions()
}

const isMentionOpen = () => Boolean(mentionSuggestions && !mentionSuggestions.hasAttribute("hidden"))

const handleMentionKeyDown = (event) => {
    if (!isMentionOpen()) return false

    const options = mentionSuggestions ? mentionSuggestions.children.length : 0
    if (!options) {
        hideMentionSuggestions()
        return false
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault()
        const direction = event.key === "ArrowDown" ? 1 : -1
        mentionActiveIndex = (mentionActiveIndex + direction + options) % options
        highlightMentionOption()
        return true
    }

    if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault()
        const option = mentionSuggestions?.children[mentionActiveIndex]
        if (option) applyMentionSelection(option.dataset.name)
        return true
    }

    if (event.key === "Escape") {
        event.preventDefault()
        hideMentionSuggestions()
        return true
    }

    return false
}

const markMentionNotification = (sender) => {
    titleState.hasUnread = true
    titleState.mentionFrom = sender
    document.title = `${sender} te Mencionou`
}

const markUnreadNotification = () => {
    titleState.hasUnread = true
    if (!titleState.mentionFrom) {
        document.title = "Novas Mensagens"
    }
}

const resetTitle = () => {
    titleState.hasUnread = false
    titleState.mentionFrom = null
    document.title = originalTitle
}

const togglePresencePanel = (forceOpen) => {
    if (!presenceToggle || !presencePanel) return

    const isOpening = forceOpen ?? presencePanel.hasAttribute("hidden")

    if (isOpening) {
        presencePanel.removeAttribute("hidden")
        presenceToggle.setAttribute("aria-expanded", "true")
    } else {
        presencePanel.setAttribute("hidden", "")
        presenceToggle.setAttribute("aria-expanded", "false")
    }
}

const processMessage = ({ data }) => {
    let payload

    try {
        payload = JSON.parse(data)
    } catch (error) {
        console.error("Mensagem inválida recebida", error)
        return
    }

    if (payload?.type === "presence") {
        handlePresenceMessage(payload)
        return
    }

    const { userId, userName, userColor, content } =
        payload?.type === "message" ? payload : payload || {}

    if (!userName || typeof content !== "string") return

    registerOnlineUser(userName, userColor)

    const isSelf = userId === user.id
    const message = isSelf
        ? createMessageSelfElement(content)
        : createMessageOtherElement(content, userName, userColor)

    chatMessages.appendChild(message)

    if (!isSelf) {
        const mentionRegex = new RegExp(`@${escapeRegExp(user.name)}\\b`, "i")
        const isMention = mentionRegex.test(content)

        if (isMention && (document.hidden || !document.hasFocus())) {
            markMentionNotification(userName)
        } else if (!isMention && (document.hidden || !document.hasFocus())) {
            markUnreadNotification()
        } else if (!isMention) {
            resetTitle()
        }
    }

    scrollScreen()
}

const sendPayload = (payload) => {
    if (!websocket || websocket.readyState !== WebSocket.OPEN) return
    websocket.send(JSON.stringify(payload))
}

const sendPresence = (action = "announce") => {
    sendPayload({
        type: "presence",
        action,
        userId: user.id,
        userName: user.name,
        userColor: user.color
    })
}

const handlePresenceMessage = ({ action, userId: senderId, userName: senderName, userColor }) => {
    if (!senderName) return

    if (action === "announce") {
        registerOnlineUser(senderName, userColor)
        return
    }

    if (action === "leave") {
        unregisterOnlineUser(senderName)
        return
    }

    if (action === "request" && senderId !== user.id) {
        sendPresence("announce")
    }
}

const handleLogin = (event) => {
    event.preventDefault()

    user.id = crypto.randomUUID()
    user.name = loginInput.value.trim()
    if (!user.name) {
        loginInput.value = ""
        loginInput.focus()
        loginInput.reportValidity()
        return
    }
    user.color = getRandomColor()

    login.style.display = "none"
    chat.style.display = "flex"

    registerOnlineUser(user.name, user.color)
    resetTitle()

    if (chatInput) {
        chatInput.focus()
    }

    websocket = new WebSocket("wss://webchat-backend-b23r.onrender.com")
    websocket.addEventListener("open", () => {
        sendPresence("announce")
        sendPresence("request")
    })
    websocket.addEventListener("message", processMessage)
}

const sendMessage = (event) => {
    event.preventDefault()

    if (!chatInput) return

    const message = {
        type: "message",
        userId: user.id,
        userName: user.name,
        userColor: user.color,
        content: chatInput.value.trim()
    }

    if (!message.content) return

    sendPayload(message)

    chatInput.value = ""
    if (embedPreview) embedPreview.innerHTML = EMBED_PREVIEW_EMPTY
    if (embedInput) embedInput.value = ""
    hideMentionSuggestions()
}

window.addEventListener("beforeunload", () => {
    try {
        sendPresence("leave")
    } catch (error) {
        // ignore shutdown errors
    }
})

loginForm.addEventListener("submit", handleLogin)
chatForm.addEventListener("submit", sendMessage)

const wrapSelection = (prefix = "", suffix = "", placeholder = "") => {
    if (!chatInput) return

    hideMentionSuggestions()

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
    insertMentionTrigger()
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

const updateProfileActionsState = () => {
    if (!profileInsertButton || !profileClearButton || !profilePreviewList) return

    const hasItems = profilePreviewList.children.length > 0
    profileInsertButton.disabled = !hasItems
    profileClearButton.disabled = !hasItems
}

updateProfileActionsState()

if (advancedToggle && advancedPanel && chatForm) {
    advancedToggle.addEventListener("click", () => {
        hideMentionSuggestions()

        const isOpen = !advancedPanel.hasAttribute("hidden")

        if (isOpen) {
            advancedPanel.setAttribute("hidden", "")
            chatForm.classList.remove("chat__form--advanced-open")
            advancedToggle.setAttribute("aria-expanded", "false")
            advancedToggle.setAttribute("aria-label", "Abrir opções avançadas")

            const embedSection = chatForm.querySelector(".chat__embed")
            if (embedSection) embedSection.open = false

            if (profileShareSection) {
                profileShareSection.classList.remove("chat__profile-share--collapsed")
                if (profileCloseButton) {
                    profileCloseButton.textContent = "×"
                    profileCloseButton.setAttribute("aria-label", "Fechar compartilhamento de perfis")
                }
            }
        } else {
            advancedPanel.removeAttribute("hidden")
            chatForm.classList.add("chat__form--advanced-open")
            advancedToggle.setAttribute("aria-expanded", "true")
            advancedToggle.setAttribute("aria-label", "Fechar opções avançadas")
        }
    })
}

if (embedCloseButton) {
    embedCloseButton.addEventListener("click", (event) => {
        event.preventDefault()
        event.stopPropagation()

        const embedSection = embedCloseButton.closest(".chat__embed")
        if (embedSection) embedSection.open = false
    })
}

if (profileCloseButton && profileShareSection) {
    profileCloseButton.addEventListener("click", () => {
        const collapsed = profileShareSection.classList.toggle("chat__profile-share--collapsed")
        if (collapsed) {
            profileCloseButton.textContent = "Reabrir"
            profileCloseButton.setAttribute("aria-label", "Reabrir compartilhamento de perfis")
        } else {
            profileCloseButton.textContent = "×"
            profileCloseButton.setAttribute("aria-label", "Fechar compartilhamento de perfis")
        }
    })
}


if (profileAddButton) {
    profileAddButton.addEventListener("click", () => {
        if (!profileNetworkSelect || !profileUrlInput || !profilePreviewList) return

        const networkKey = profileNetworkSelect.value
        const config = SOCIAL_NETWORKS[networkKey]
        if (!config) return

        const rawUrl = profileUrlInput.value.trim()
        if (!rawUrl) {
            profileUrlInput.focus()
            profileUrlInput.reportValidity()
            return
        }

        let parsedUrl

        try {
            parsedUrl = new URL(rawUrl)
        } catch (error) {
            profileUrlInput.setCustomValidity("Cole um link válido.")
            profileUrlInput.reportValidity()
            profileUrlInput.setCustomValidity("")
            profileUrlInput.focus()
            profileUrlInput.select()
            return
        }

        const previewItem = document.createElement("button")

        previewItem.type = "button"
        previewItem.className = `mp-button ${config.className} chat__profile-preview-item`
        previewItem.dataset.network = networkKey
        previewItem.dataset.url = parsedUrl.href
        previewItem.title = `Remover ${config.label}`
        previewItem.innerHTML = `<img src="${config.icon}" alt="${config.label}" />`

        profilePreviewList.appendChild(previewItem)

        profileUrlInput.value = ""
        profileUrlInput.focus()

        updateProfileActionsState()
    })
}

if (profilePreviewList) {
    profilePreviewList.addEventListener("click", (event) => {
        const target = event.target.closest(".chat__profile-preview-item")
        if (!target) return

        event.preventDefault()
        target.remove()
        updateProfileActionsState()
    })
}

if (profileInsertButton) {
    profileInsertButton.addEventListener("click", () => {
        if (!profilePreviewList || !chatInput) return

        const anchors = Array.from(profilePreviewList.children)
            .map((item) => {
                const { network, url } = item.dataset
                const config = SOCIAL_NETWORKS[network]

                if (!config || !url) return null

                return `    <a class="mp-button ${config.className}" href="${url}" target="_blank" rel="noreferrer">\n        <img src="${config.icon}" alt="${config.label}" />\n    </a>`
            })
            .filter(Boolean)
            .join("\n")

        if (!anchors) return

        const wrapperMarkup = `<div class="mp-social-wrapper">\n${anchors}\n</div>`
        const separator = chatInput.value ? "\n\n" : ""

        chatInput.value = `${chatInput.value}${separator}${wrapperMarkup}`
        chatInput.focus()
        chatInput.selectionStart = chatInput.value.length
        chatInput.selectionEnd = chatInput.value.length

        profilePreviewList.innerHTML = ""
        updateProfileActionsState()
    })
}

if (profileClearButton) {
    profileClearButton.addEventListener("click", () => {
        if (!profilePreviewList) return

        profilePreviewList.innerHTML = ""
        updateProfileActionsState()
    })
}

if (mentionSuggestions) {
    mentionSuggestions.addEventListener("mousedown", (event) => event.preventDefault())
    mentionSuggestions.addEventListener("click", (event) => {
        const option = event.target.closest(".chat__mention-item")
        if (!option) return

        applyMentionSelection(option.dataset.name)
    })
}

if (chatInput) {
    chatInput.addEventListener("input", () => updateMentionSuggestions())
    chatInput.addEventListener("click", () => updateMentionSuggestions())
    chatInput.addEventListener("keydown", (event) => {
        if (handleMentionKeyDown(event)) {
            return
        }

        if (
            event.key === "Backspace" ||
            event.key === "Delete" ||
            event.key === "ArrowLeft" ||
            event.key === "ArrowRight" ||
            event.key === "Home" ||
            event.key === "End"
        ) {
            setTimeout(() => updateMentionSuggestions(), 0)
        }
    })

    chatInput.addEventListener("blur", () => {
        setTimeout(() => {
            if (isMentionOpen()) {
                hideMentionSuggestions()
            }
        }, 120)
    })
}

if (presenceToggle) {
    presenceToggle.addEventListener("click", () => togglePresencePanel())
}

document.addEventListener("click", (event) => {
    if (!presencePanel || !presenceToggle) return

    if (
        !presencePanel.contains(event.target) &&
        !presenceToggle.contains(event.target)
    ) {
        togglePresencePanel(false)
    }
})

window.addEventListener("focus", resetTitle)
document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        resetTitle()
    }
})

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
        if (!embedPreview || !embedInput || !chatInput) return

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
