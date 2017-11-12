#include <QPushButton>
#include "../tests/widgets.h"
#include "../inc/PushButton.h"

void PushButton::InitWidget() {
    widget = new QPushButton();
}

void PushButton::SetText(const char* text) {
    dynamic_cast<QPushButton*>(widget)->setText(text);
}

void PushButton::SetOnClicked(NoArgumentsCallback *callback) {
    parent->SetHandler(callback, this);
    QObject::connect(dynamic_cast<QPushButton*>(widget), SIGNAL(clicked(bool)), parent, SLOT(handleClick()));
}

//-------------------------------------------------------------------

struct PushButton* PushButton_New(Widget *parent) {
    Widget* widget = new PushButton();
    return dynamic_cast<PushButton*>(InitWidget(widget, parent));
}

void PushButton_SetText(PushButton *button, const char *text) {
    button->SetText(text);
}

void PushButton_SetOnClicked(struct PushButton *button, NoArgumentsCallback *callback) {
    button->SetOnClicked(callback);
}
