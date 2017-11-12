#include "../tests/widgets.h"
#include "../inc/Application.h"

int Application::Execute() {
    app.exec();
}

//-----------------------------------

struct Application* Application_New(int argc, char *argv[]) {
    return new Application(argc, argv);
}

int Application_Exec(Application *app) {
    return app->Execute();
}