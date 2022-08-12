http_codes = {
    badRequest: 400,
    internalError: 500,
    created: 201,
    notFound: 404,
    ok: 200,
    notImplemented: 501,
    forbidden: 403,
    unAuthorized: 401
}

messages = {
    nameNotValid: "First Name or Last Name cannot contain numeric values.",
    internalServerError: "Internal server error",
    registered: "Registered",
    incorrectpass: "Incorrect Password",
    notFound: "Email address not found",//"Reccord not found",
    tokeninvalidorexpire: "Token Invalid or Expired",
    emailExist: "User already registered, Please login!",
    passwordChanged: "Password changed",
    invalidEmail: 'Enter Valid Email Address',
    invalidPass: 'Password should contain at least 6 characters minimum, numeric values and 1 special character.',
    mailNotSent: "Mail not send",
    invalidToken: 'Invalid Token',
    invalidBody: 'Invalid input',
    deacacc: 'Deactivated Account',
    passwordreset: 'Password reset',
    mailnotsend: 'cant send mail currently try after sometime',
    userdeleted: 'User Deleted',
    sportadded: 'Sport Added',
    youcantaccess: 'You Dont have access to these service',
    sportdeleted: 'Sport Deleted',
    eventcreated: 'Event Created',
    eventjoin: 'Event Joined',
    preferencesupdated: 'Preferences Updated',
    emailvalidate: "Email Validated",
    verifyemailfirst: "Verify Your Email First",
    emailAlreadyRegistered: "Email already registered",
    latlongincorrect: "longitude/latitude is out of bounds",
    preferancedeleted: "Preferance Removed",
    placeadded: "Place added",
    addrate: "Rating Added",
    eventfull: "Event Full",
    validatefirst: "Validate you email first",
    invitatdec: "Invitation declined",
    eventdel: "Event deleted",
    cantdeleve: "You can not delete this event",
    evenotfound: "Event not found",
    eventunjoin: "Event unjoined",
    cannotjoinevent: "You can not join this this event as you have already joined an event which will happen at this time.",
    invalidEmailPass: "Email or Password is incorrect",//'Invalid email or password, Email_format:standard email format. Password_format: between 8 to 20 character with number and special character eg. Superm@n123',
    removeNotification: "Notification Removed",
    notFinishedEventRateError: "You can not do rating on future events."
}
schemas = {
    admin: 'admin',
    user: 'user',
    chat: 'chat',
    sport: 'sport',
    event: 'event',
    place: 'place'
}
status = {
    active: "ACTIVE",
    deactive: "DEACTIVE",
    read: "READ",
    unread: "UNREAD"
}
role = {
    admin: "ADMIN",
    user: "USER"
}
level = {
    beginner: "BEGINNER",
    intermediate: "INTERMEDIATE",
    advanced: "ADVANCED",
    all: "ALL"
}
gender = {
    men: "MEN",
    women: "WOMEN",
    both: "BOTH"
}
eventType = {
    public: "PUBLIC",
    private: "PRIVATE",
    participate: "PARTICIPATE"
}
rateas = {
    player: "PLAYER",
    organizer: "ORGANIZER"
}
module.exports = {
    schemas,
    http_codes,
    messages,
    status,
    role,
    level,
    gender,
    eventType,
    rateas
}