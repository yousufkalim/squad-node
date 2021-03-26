const userRouter = require('express').Router();
const service = require('./userService')
const validate = require('./userValidator')
const actions = require('./userAction')
// latlongtokm



userRouter.route('/register')
    .post([validate.validateSignUp], (req, res, next) => {
        actions.registerUser(req, res, next)
    });
userRouter.route('/login')
    .post([validate.validateLogin], (req, res, next) => {
        actions.loginUser(req, res, next)
    });
userRouter.route('/loginAdmin')
    .post([validate.validateLogin], (req, res, next) => {
        actions.loginAdmin(req, res, next)
    });
userRouter.route('/userdetail')
    .get([], (req, res, next) => {
        actions.userdetail(req, res, next)
    });
userRouter.route('/forgotPassword')
    .post([], (req, res) => {
        actions.forgotPassword(req, res)
    })
userRouter.route('/verifyToken')
    .get([], (req, res) => {
        actions.verifyToken(req, res)
    })
userRouter.route('/peoplecount')
    .get([], (req, res) => {
        actions.peoplecount(req, res)
    })
userRouter.route('/reset/:token')
    .get([], (req, res) => {
        actions.getresetpassword(req, res)
    })
userRouter.route('/reset/:token')
    .post([], (req, res) => {
        actions.resetpassword(req, res)
    })
userRouter.route('/validateemail/:id')
    .get([], (req, res) => {
        actions.getvalidateemail(req, res)
    })
userRouter.route('/validateemail/:id')
    .post([], (req, res) => {
        actions.validateemail(req, res)
    })
userRouter.route('/getprofile')
    .get([validate.verifyToken], (req, res) => {
        actions.getprofile(req, res)
    })
userRouter.route('/update')
    .put([validate.verifyToken, validate.validateUpdate], (req, res) => {
        actions.update(req, res)
    })
userRouter.route('/sportlist')
    .get([validate.verifyToken], (req, res) => {
        actions.sportlist(req, res)
    })

userRouter.route('/gmail/socialLogin')
    .post([validate.validateSocialLogin], (req, res) => {
        actions.socialloginGmail(req, res)
    })
userRouter.route('/facebook/socialLogin')
    .post([validate.validateSocialLoginFace], (req, res) => {
        actions.socialloginFacebook(req, res)
    })
userRouter.route('/linkedin/socialLogin')
    .post([validate.validateSocialLoginLinkedin], (req, res) => {
        actions.socialloginLinkedin(req, res)
    })


userRouter.route('/createpreference')
    .post([validate.verifyToken, validate.verifyaddpreferance], (req, res) => {
        actions.createpreference(req, res)
    })
userRouter.route('/getpreference')
    .get([validate.verifyToken], (req, res) => {
        actions.getpreference(req, res)
    })
userRouter.route('/getuserpreference')
    .get([validate.verifyToken], (req, res) => {
        actions.getuserpreference(req, res)
    })

userRouter.route('/updatepreference')
    .put([validate.verifyToken], (req, res) => {
        actions.updatepreference(req, res)
    })
userRouter.route('/removepreference')
    .put([validate.verifyToken], (req, res) => {
        actions.removepreference(req, res)
    })
userRouter.route('/test')
    .get([], (req, res) => {
        res.redirect('squad://reset/123')
    })

userRouter.route('/peoplearound')
    .post([validate.verifyToken], (req, res) => {
        actions.peoplearound(req, res)
    })
userRouter.route('/peoplenewtosquad')
    .get([validate.verifyToken], (req, res) => {
        actions.peoplenewtosquad(req, res)
    })
userRouter.route('/peopleimet')
    .get([validate.verifyToken], (req, res) => {
        actions.peopleimet(req, res)
    })
userRouter.route('/invitepeople')
    .post([validate.verifyToken], (req, res) => {
        actions.invitepeople(req, res)
    })
////////////////rate
userRouter.route('/add/playerrating')
    .post([validate.verifyToken], (req, res) => {
        actions.addRatingasplayer(req, res)
    })
userRouter.route('/add/organizerrating')
    .post([validate.verifyToken], (req, res) => {
        actions.addRatingasorganizer(req, res)
    })
userRouter.route('/getinvite/:eventId/:userId')
    .get([], (req, res) => {
        actions.getinvite(req, res)
    })



//friends functionality 
userRouter.route('/listforfriendrequest')
    .get([validate.verifyToken], (req, res) => {
        actions.listforfriendrequest(req, res)
    })
userRouter.route('/listorsentrequest')
    .get([validate.verifyToken], (req, res) => {
        actions.listorsentrequest(req, res)
    })
userRouter.route('/canclerequest')
    .post([validate.verifyToken], (req, res) => {
        actions.canclerequest(req, res)
    })
userRouter.route('/sendrequest')
    .post([validate.verifyToken], (req, res) => {
        actions.sendrequest(req, res)
    })
userRouter.route('/requestlist')
    .get([validate.verifyToken], (req, res) => {
        actions.requestlist(req, res)
    })
userRouter.route('/friendlist')
    .get([validate.verifyToken], (req, res) => {
        actions.friendlist(req, res)
    })
userRouter.route('/acceptrequest')
    .post([validate.verifyToken], (req, res) => {
        actions.acceptrequest(req, res)
    })
userRouter.route('/declinerequest')
    .post([validate.verifyToken], (req, res) => {
        actions.declinerequest(req, res)
    })
userRouter.route('/unfriend')
    .post([validate.verifyToken], (req, res) => {
        actions.unfriend(req, res)
    })

userRouter.route('/list/gamenotification')
    .get([validate.verifyToken], (req, res) => {
        actions.gamenotification(req, res)
    })
userRouter.route('/list/friendnotification')
    .get([validate.verifyToken], (req, res) => {
        actions.friendnotification(req, res)
    })
userRouter.route('/gamenotifdecline')
    .post([validate.verifyToken], (req, res) => {
        actions.gamenotifdecline(req, res)
    })
userRouter.route('/logout')
    .post([validate.verifyToken], (req, res) => {
        actions.logout(req, res)
    })


module.exports = userRouter;