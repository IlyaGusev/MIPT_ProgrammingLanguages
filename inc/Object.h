#pragma once
#include <QObject>
#include "../tests/widgets.h"
#include <string>
#include <vector>

class Object : public QObject 
{
	Q_OBJECT

public:
	Object() : callback(0), callbackSender(0) {};
	virtual ~Object();

	const char* GetClassName();
	void AddChild(Object* object);
	void SetHandler(NoArgumentsCallback *c, Object* s);

public Q_SLOTS:
	void handleClick();

private:
	std::string name;
	std::vector<Object*> children;
	NoArgumentsCallback *callback;
	Object* callbackSender;
};