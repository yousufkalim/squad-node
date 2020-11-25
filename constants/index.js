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
    internalServerError: "Internal server error",
    registered: "Registered",
    incorrectpass: "Incorrect Password",
    notFound: "User not found",
    tokeninvalidorexpire: "Token Invalid or Expired",
    passwordChanged: "Password changed",
    mailNotSent: "Mail not send",
    invalidToken: 'Invalid Token',
    invalidBody: 'Invalid input',
    deacacc: 'Deactivated Account',
    passwordreset: 'Password reset',
    mailnotsend: 'cant send mail currently try after sometime',
    userdeleted: 'user Deleted'
}
schemas = {
    admin: 'admin',
    user: 'user',
    chat: 'chat',
    sport: 'sport'
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
module.exports = {
    schemas,
    http_codes,
    messages,
    status,
    role
}