"use client";
import React, { useState, useEffect } from 'react';
import useAuthStore from '@/store/authStore';
import api from '@/services/api';

const UserAvatar = ({ 
  size = 'md', 
  className = '', 
  showOnlineStatus = false,
  clickable = false,
  onClick = null
}) => {
  const { user, profilePhotoUrl, profilePhotoTimestamp, setProfilePhotoUrl } = useAuthStore();
  const [imageLoaded, setImageLoaded] = useState(false);

  // Size variants
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl',
    '3xl': 'w-24 h-24 text-3xl'
  };

  const dotSizes = {
    xs: 'w-2 h-2',
    sm: 'w-2 h-2', 
    md: 'w-3 h-3',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
    '2xl': 'w-4 h-4',
    '3xl': 'w-5 h-5'
  };

  // Load profile photo on mount and when timestamp changes
  useEffect(() => {
    const loadProfilePhoto = async () => {
      try {
        const response = await api.get('/api/profile/photo');
        if (response.data.success && response.data.data.url) {
          setProfilePhotoUrl(response.data.data.url);
        } else {
          setProfilePhotoUrl(null);
        }
      } catch (error) {
        console.log('No profile photo found or error loading:', error);
        setProfilePhotoUrl(null);
      }
    };

    if (user) {
      loadProfilePhoto();
    }
  }, [user, profilePhotoTimestamp, setProfilePhotoUrl]);

  // Reset image loaded state when photo URL changes
  useEffect(() => {
    setImageLoaded(false);
  }, [profilePhotoUrl]);

  // Generate user initials
  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setProfilePhotoUrl(null);
    setImageLoaded(false);
  };

  const avatarClasses = `
    ${sizeClasses[size]} 
    ${className}
    relative rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700 
    ${clickable ? 'cursor-pointer hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 transition-all' : ''}
    bg-gradient-to-r from-blue-500 to-purple-600 
    flex items-center justify-center text-white font-bold
  `.trim();

  return (
    <div className={avatarClasses} onClick={clickable && onClick ? onClick : undefined}>
      {profilePhotoUrl && !imageLoaded && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}
      
      {profilePhotoUrl ? (
        <img
          src={profilePhotoUrl}
          alt={`${user?.name || 'User'} profile`}
          className="w-full h-full object-cover"
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{ display: imageLoaded ? 'block' : 'none' }}
        />
      ) : null}
      
      {(!profilePhotoUrl || !imageLoaded) && (
        <span className={`${imageLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
          {getUserInitials()}
        </span>
      )}

      {showOnlineStatus && (
        <div className={`absolute bottom-0 right-0 ${dotSizes[size]} bg-green-500 border-2 border-white dark:border-gray-800 rounded-full`} />
      )}
    </div>
  );
};

export default UserAvatar;