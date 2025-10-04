import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';

// Ensure axios uses the correct base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const SelectorContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const SelectorTitle = styled.h3`
  margin: 0 0 15px 0;
  color: #4ade80;
  font-size: 1.1rem;
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
  max-height: 200px;
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
  padding: 10px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
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
`;

const PlacementDetails = styled.div`
  font-size: 0.8rem;
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
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
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

const EmptyState = styled.div`
  text-align: center;
  padding: 20px;
  opacity: 0.7;
  font-style: italic;
`;

function PlacementSelector({ 
  mapId, 
  currentPlacements, 
  onLoadPlacement, 
  onSavePlacement,
  disabled = false
}) {
  const [activeTab, setActiveTab] = useState('global');
  const [placements, setPlacements] = useState({ global: [], user: [], favorites: [] });
  const [loading, setLoading] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveForm, setSaveForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  // Load placements when mapId changes
  useEffect(() => {
    if (mapId) {
      loadPlacements();
    }
  }, [mapId]);

  const loadPlacements = async () => {
    if (!mapId) return;
    
    console.log('Loading placements for:', { mapId, url: `${API_BASE_URL}/placements/map/${mapId}` });
    
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/placements/map/${mapId}`);
      setPlacements(response.data);
    } catch (error) {
      console.error('Failed to load placements:', error);
      console.error('Request URL:', `${API_BASE_URL}/placements/map/${mapId}`);
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadPlacement = (placement) => {
    if (disabled) return;
    onLoadPlacement(placement.placements);
  };

  const handleToggleFavorite = async (placementId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/placements/${placementId}/favorite`);
      // Reload placements to update favorite status
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

  const handleSaveClick = () => {
    if (!currentPlacements || currentPlacements.length !== 40) {
      alert('Please place all 40 pieces before saving');
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

      // Reset form and close
      setSaveForm({ name: '', description: '' });
      setShowSaveForm(false);
      
      // Reload placements
      await loadPlacements();
      
      // Switch to user tab to show the new placement
      setActiveTab('user');
      
    } catch (error) {
      console.error('Failed to save placement:', error);
      alert('Failed to save placement');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCancel = () => {
    setSaveForm({ name: '', description: '' });
    setShowSaveForm(false);
  };

  const getCurrentPlacements = () => {
    switch (activeTab) {
      case 'global': return placements.global;
      case 'user': return placements.user;
      case 'favorites': return placements.favorites;
      default: return [];
    }
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

  return (
    <SelectorContainer>
      <SelectorTitle>Saved Placements</SelectorTitle>
      
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
        <EmptyState>Loading placements...</EmptyState>
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
                    disabled={disabled}
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
            disabled={disabled || !currentPlacements || currentPlacements.length !== 40}
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
    </SelectorContainer>
  );
}

export default PlacementSelector;