import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';

// Ensure axios uses the correct base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg, #2d3436 0%, #636e72 100%);
  border-radius: 15px;
  padding: 25px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.5);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ModalTitle = styled.h2`
  margin: 0;
  color: #4ade80;
  font-size: 1.4rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #fff;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
`;

const Tab = styled.button`
  background: ${props => props.active ? 'rgba(102, 126, 234, 0.3)' : 'transparent'};
  border: none;
  color: white;
  padding: 8px 16px;
  cursor: pointer;
  border-bottom: 2px solid ${props => props.active ? '#667eea' : 'transparent'};
  transition: all 0.3s ease;

  &:hover {
    background: rgba(102, 126, 234, 0.2);
  }
`;

const PlacementList = styled.div`
  max-height: 400px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }
`;

const PlacementItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
  }
`;

const PlacementInfo = styled.div`
  flex: 1;
`;

const PlacementName = styled.div`
  font-weight: 600;
  margin-bottom: 4px;
  font-size: 1rem;
`;

const PlacementDetails = styled.div`
  font-size: 0.85rem;
  opacity: 0.7;
`;

const PlacementActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  background: ${props => {
    switch(props.variant) {
      case 'load': return 'linear-gradient(45deg, #22c55e, #16a34a)';
      case 'favorite': return props.favorited ? 'linear-gradient(45deg, #eab308, #ca8a04)' : 'rgba(255, 255, 255, 0.1)';
      case 'delete': return 'linear-gradient(45deg, #ef4444, #dc2626)';
      default: return 'rgba(255, 255, 255, 0.1)';
    }
  }};
  border: 1px solid ${props => {
    switch(props.variant) {
      case 'favorite': return props.favorited ? '#eab308' : 'rgba(255, 255, 255, 0.3)';
      default: return 'transparent';
    }
  }};
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 30px;
  opacity: 0.7;
  font-style: italic;
  color: #ccc;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 30px;
  color: #4ade80;
`;

const SaveContainer = styled.div`
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
`;

const SaveForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Input = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.9rem;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
  }
`;

const TextArea = styled.textarea`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.9rem;
  resize: vertical;
  min-height: 60px;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
  }
`;

const SaveActions = styled.div`
  display: flex;
  gap: 8px;
`;

const SaveButton = styled.button`
  background: linear-gradient(45deg, #667eea, #764ba2);
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const CancelButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

function SavedPlacementsModal({ 
  isOpen,
  onClose,
  mapId, 
  currentPlacements,
  onLoadPlacement,
  onSavePlacement,
  expectedPieceCount = 40
}) {
  const [activeTab, setActiveTab] = useState('global');
  const [placements, setPlacements] = useState({ global: [], user: [], favorites: [] });
  const [loading, setLoading] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveForm, setSaveForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  // Load placements when modal opens or mapId changes
  useEffect(() => {
    if (isOpen && mapId) {
      loadPlacements();
    }
  }, [isOpen, mapId]);

  const loadPlacements = async () => {
    if (!mapId) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/placements/map/${mapId}`);
      setPlacements(response.data);
    } catch (error) {
      console.error('Failed to load placements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadPlacement = (placement) => {
    onLoadPlacement(placement.placements);
    onClose();
  };

  const handleToggleFavorite = async (placementId) => {
    try {
      await axios.post(`${API_BASE_URL}/placements/${placementId}/favorite`);
      await loadPlacements();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleDeletePlacement = async (placementId) => {
    if (!confirm('Are you sure you want to delete this placement?')) return;
    
    try {
      await axios.delete(`${API_BASE_URL}/placements/${placementId}`);
      await loadPlacements();
    } catch (error) {
      console.error('Failed to delete placement:', error);
    }
  };

  const getCurrentPlacements = () => {
    switch (activeTab) {
      case 'global': return placements.global;
      case 'user': return placements.user;
      case 'favorites': return placements.favorites;
      default: return [];
    }
  };

  const handleSaveClick = () => {
    if (!currentPlacements || currentPlacements.length !== expectedPieceCount) {
      alert(`Please place all ${expectedPieceCount} pieces before saving`);
      return;
    }
    setShowSaveForm(true);
  };

  const handleSaveSubmit = async () => {
    if (!saveForm.name.trim()) {
      alert('Please enter a name for the placement');
      return;
    }

    setSaving(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/placements`, {
        name: saveForm.name,
        description: saveForm.description,
        mapId,
        placements: currentPlacements,
        isGlobal: false
      });

      // Call parent callback
      if (onSavePlacement) {
        onSavePlacement(response.data);
      }

      // Reset form and close save form
      setSaveForm({ name: '', description: '' });
      setShowSaveForm(false);
      
      // Reload placements
      await loadPlacements();
      
      // Switch to user tab to show the new placement
      setActiveTab('user');
      
    } catch (error) {
      console.error('Failed to save placement:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to save placement';
      alert(`Failed to save placement: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCancel = () => {
    setSaveForm({ name: '', description: '' });
    setShowSaveForm(false);
  };

  const getTabLabel = (tab) => {
    const count = placements[tab]?.length || 0;
    const labels = {
      global: 'Global',
      user: 'My Setups',
      favorites: 'Favorites'
    };
    return `${labels[tab]} (${count})`;
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Saved Placements</ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>
        
        <TabContainer>
          <Tab 
            active={activeTab === 'global'} 
            onClick={() => setActiveTab('global')}
          >
            {getTabLabel('global')}
          </Tab>
          <Tab 
            active={activeTab === 'user'} 
            onClick={() => setActiveTab('user')}
          >
            {getTabLabel('user')}
          </Tab>
          <Tab 
            active={activeTab === 'favorites'} 
            onClick={() => setActiveTab('favorites')}
          >
            {getTabLabel('favorites')}
          </Tab>
        </TabContainer>

        {loading ? (
          <LoadingState>Loading placements...</LoadingState>
        ) : (
          <PlacementList>
            {getCurrentPlacements().length === 0 ? (
              <EmptyState>
                {activeTab === 'global' && 'No global placements available'}
                {activeTab === 'user' && 'No saved placements yet'}
                {activeTab === 'favorites' && 'No favorite placements yet'}
              </EmptyState>
            ) : (
              getCurrentPlacements().map((placement) => (
                <PlacementItem key={placement.id}>
                  <PlacementInfo>
                    <PlacementName>{placement.name}</PlacementName>
                    <PlacementDetails>
                      {placement.description && `${placement.description} • `}
                      By {placement.creator?.username || 'System'}
                    </PlacementDetails>
                  </PlacementInfo>
                  <PlacementActions>
                    <ActionButton
                      variant="load"
                      onClick={() => handleLoadPlacement(placement)}
                    >
                      Load
                    </ActionButton>
                    <ActionButton
                      variant="favorite"
                      favorited={activeTab === 'favorites'}
                      onClick={() => handleToggleFavorite(placement.id)}
                    >
                      {activeTab === 'favorites' ? '★' : '☆'}
                    </ActionButton>
                    {activeTab === 'user' && (
                      <ActionButton
                        variant="delete"
                        onClick={() => handleDeletePlacement(placement.id)}
                      >
                        ×
                      </ActionButton>
                    )}
                  </PlacementActions>
                </PlacementItem>
              ))
            )}
          </PlacementList>
        )}

        {!showSaveForm ? (
          <SaveContainer>
            <SaveButton 
              onClick={handleSaveClick}
              disabled={!currentPlacements || currentPlacements.length !== expectedPieceCount}
            >
              Save Current Setup
            </SaveButton>
          </SaveContainer>
        ) : (
          <SaveContainer>
            <SaveForm>
              <Input
                type="text"
                placeholder="Placement name..."
                value={saveForm.name}
                onChange={(e) => setSaveForm({ ...saveForm, name: e.target.value })}
              />
              <TextArea
                placeholder="Description (optional)..."
                value={saveForm.description}
                onChange={(e) => setSaveForm({ ...saveForm, description: e.target.value })}
              />
              <SaveActions>
                <SaveButton 
                  onClick={handleSaveSubmit}
                  disabled={saving || !saveForm.name.trim()}
                >
                  {saving ? 'Saving...' : 'Save'}
                </SaveButton>
                <CancelButton onClick={handleSaveCancel}>
                  Cancel
                </CancelButton>
              </SaveActions>
            </SaveForm>
          </SaveContainer>
        )}
      </ModalContent>
    </ModalOverlay>
  );
}

export default SavedPlacementsModal;