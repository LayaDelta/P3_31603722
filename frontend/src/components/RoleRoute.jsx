import { Navigate } from 'react-router-dom';

const RoleRoute = ({ children, allowedRoles, userRole }) => {
  if (!userRole) return <Navigate to="/login" />;
  
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/" />;
  }
  
  return children;
};

export default RoleRoute;