import React from 'react';
import { FaUser } from 'react-icons/fa';
import '../styles/UserInfo.css';

const UserInfo = ({ user }) => {
  if (!user) {
    return null;
  }

  return (
    <div className="user-info">
      <div className="user-avatar">
        <FaUser />
      </div>
      <div className="user-details">
        <div className="user-name">
          {user.nom} {user.postnom}
        </div>
      </div>
    </div>
  );
};

export default UserInfo;
