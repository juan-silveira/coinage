"use client";
import React, { useState, useEffect } from 'react';
import useAuthStore from '@/store/authStore';
import s3PhotoService from '@/services/s3PhotoService';
import ClientOnly from './ClientOnly';

const UserAvatarHybrid = ({ 
  size = 'md', 
  className = '', 
  showOnlineStatus = false,
  showSource = false, // Mostrar badge indicando fonte (S3/IndexedDB)
  clickable = false,
  onClick = null
}) => {
  const { user, profilePhotoUrl, setProfilePhotoUrl } = useAuthStore();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [photoSource, setPhotoSource] = useState(null); // 's3' | 'indexeddb' | null

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

  // Load profile photo with hybrid strategy
  useEffect(() => {
    const loadProfilePhoto = async () => {
      if (!user?.id) return;

      try {
        console.log('📸 [UserAvatar] Carregando foto híbrida...');
        
        // Usar o serviço híbrido S3 + IndexedDB
        const result = await s3PhotoService.loadProfilePhoto(user.id);
        
        if (result.url) {
          setProfilePhotoUrl(result.url);
          setPhotoSource(result.source);
          console.log(`✅ [UserAvatar] Foto carregada da fonte: ${result.source}`);
        } else {
          console.log('📭 [UserAvatar] Nenhuma foto encontrada');
          setPhotoSource(null);
        }
      } catch (error) {
        console.error('❌ [UserAvatar] Erro ao carregar foto:', error);
        setPhotoSource(null);
      }
    };

    // Load on mount and when user changes
    if (user?.id && !profilePhotoUrl) {
      loadProfilePhoto();
    }
  }, [user?.id, setProfilePhotoUrl]);

  // Get user initials for fallback
  const getInitials = () => {
    if (!user?.name) return '?';
    return user.name
      .split(' ')
      .map(word => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Handle image load
  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    console.warn('⚠️ [UserAvatar] Erro ao carregar imagem, usando fallback');
    setImageLoaded(false);
    setProfilePhotoUrl(null);
    setPhotoSource(null);
  };

  // Source badge component
  const renderSourceBadge = () => {
    if (!showSource || !photoSource || !profilePhotoUrl) return null;

    const badgeConfig = {
      s3: {
        color: 'bg-blue-500',
        icon: '☁️',
        title: 'Foto armazenada no S3'
      },
      indexeddb: {
        color: 'bg-purple-500',
        icon: '💾',
        title: 'Foto armazenada localmente'
      }
    };

    const config = badgeConfig[photoSource];
    if (!config) return null;

    return (
      <div 
        className={`absolute -top-1 -right-1 ${config.color} rounded-full w-4 h-4 flex items-center justify-center text-xs`}
        title={config.title}
      >
        {config.icon}
      </div>
    );
  };

  return (
    <ClientOnly>
      <div className={`relative ${clickable ? 'cursor-pointer' : ''}`} onClick={onClick}>
        <div
          className={`
            ${sizeClasses[size]} 
            ${className}
            relative rounded-full bg-gradient-to-br from-blue-400 to-purple-600 
            flex items-center justify-center text-white font-semibold
            overflow-hidden transition-all duration-200
            ${clickable ? 'hover:scale-105 hover:shadow-lg' : ''}
          `}
        >
          {profilePhotoUrl ? (
            <>
              <img
                src={profilePhotoUrl}
                alt={user?.name || 'Avatar'}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </>
          ) : (
            <span className="select-none">
              {getInitials()}
            </span>
          )}

          {/* Online Status Indicator */}
          {showOnlineStatus && (
            <div className={`absolute bottom-0 right-0 ${dotSizes[size]} bg-green-400 border-2 border-white dark:border-gray-800 rounded-full`}></div>
          )}
        </div>

        {/* Source Badge */}
        {renderSourceBadge()}

        {/* Loading overlay quando não há foto */}
        {user?.id && !profilePhotoUrl && !photoSource && (
          <div className="absolute inset-0 bg-black bg-opacity-20 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </ClientOnly>
  );
};

export default UserAvatarHybrid;