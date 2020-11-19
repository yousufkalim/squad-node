http_codes = {
    badRequest: 400,
    internalError: 500,
    created: 201,
    notFound: 404,
    ok: 200,
    notImplemented: 501,
    forbidden: 403,
    unAuthorized:401
}

messages = {
    internalServerError:"Internal server error",
    registered:"Registered",
    incorrectpass:"Incorrect Password",
    notFound:"User not found",
    tokeninvalidorexpire:"Token Invalid or Expired",
    passwordChanged:"Password changed",
    mailNotSent:"Mail not send"
}
schemas = {
    admin: 'admin',
    user:'user'
}


module.exports = {
    schemas,
    http_codes,
    messages
}