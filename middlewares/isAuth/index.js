function isAuthenticated(req, res, next) {
    // get cookie 
    const token = req.cookies.auth_token;
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized, token not found' });
    }
    
    next();
  }

  export default isAuthenticated;