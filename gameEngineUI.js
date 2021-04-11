var _mainDiv;

function InitUI(divName) {
    _mainDiv = document.getElementById(divName);
    _mainDiv.style.position = 'absolute';
    _mainDiv.style.width = '100%';
    _mainDiv.style.height = '100%';
    _mainDiv.style.left = 0;
    _mainDiv.style.top = 0;

    _mainDiv.style.display = 'flex';
    _mainDiv.style.justifyContent = 'center';
    _mainDiv.style.alignItems = 'center';
}

function ShowUI(show) {
    HidePanel(_mainDiv, show);
}

function HidePanel(panel, show) {
    panel.style.display = show ? 'flex' : 'none';
}

function CreatePanel(parent, size, backgroundColor, flexDirection) {

    if (!parent) {
        parent = _mainDiv;
    }

    if (!flexDirection) {
        flexDirection = 'row';
    }

    var panel = document.createElement('div');
    panel.style.width = size[0] + '%';
    panel.style.height = size[1] + '%';
    panel.style.backgroundColor = backgroundColor;
    panel.style.display = 'flex';
    panel.style.alignItems = 'center';
    panel.style.justifyContent = 'center';
    panel.style.flexDirection = flexDirection;

    parent.appendChild(panel);

    return panel;
}

function CreateLabel(parent, size, text, fontSize, textColor, backgroundColor) {
    var label = CreatePanel(parent, size, backgroundColor);
    if (!textColor) {
        textColor = 'black';
    }
    label.style.color = textColor;
    label.style.fontSize = fontSize + "em";
    label.innerHTML = text;

    return label;
}

function CreateButton(parent, size, text, handler, margin) {

    var button = document.createElement('button');
    button.style.width = size[0] + '%';
    button.style.height = size[1] + '%';
    button.style.margin = margin + 'px';
    button.innerHTML = text;
    button.onclick = handler;

    parent.appendChild(button);

    return button;
}