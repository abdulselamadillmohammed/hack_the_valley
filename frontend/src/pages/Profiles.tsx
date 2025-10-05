import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfiles, createProfile, deleteProfile } from "../api";
import { getToken, clearToken, setActiveProfileId } from "../auth";

type Profile = {
  id: number;
  name: string;
  is_default?: boolean;
  avatar_url?: string | null;
  created_at?: string;
};

export default function Profiles() {
  const nav = useNavigate();
  const [token, setTokenState] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [manageMode, setManageMode] = useState(false);

  useEffect(() => {
    const t = getToken();
    if (!t) {
      nav("/login");
      return;
    }
    setTokenState(t);
    loadProfiles(t);
  }, [nav]);

  async function loadProfiles(tok: string) {
    setLoading(true);
    setError("");
    try {
      const data = await getProfiles(tok);
      const list = Array.isArray(data) ? data : data?.results || [];
      setProfiles(list);
    } catch (e: any) {
      setError(e?.message || "Failed to load profiles");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !newProfileName.trim()) return;

    setLoading(true);
    setError("");
    try {
      await createProfile(token, newProfileName.trim(), profiles.length === 0);
      setNewProfileName("");
      setShowAddProfile(false);
      await loadProfiles(token);
    } catch (e: any) {
      setError(e?.message || "Failed to create profile");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteProfile(profileId: number) {
    if (!token) return;
    if (!confirm("Are you sure you want to delete this profile?")) return;

    setLoading(true);
    setError("");
    try {
      await deleteProfile(token, profileId);
      await loadProfiles(token);
    } catch (e: any) {
      setError(e?.message || "Failed to delete profile");
    } finally {
      setLoading(false);
    }
  }

  function selectProfile(profile: Profile) {
    if (manageMode) return;
    setActiveProfileId(profile.id);
    nav("/journal");
  }

  function handleLogout() {
    clearToken();
    nav("/login");
  }

  return (
    <div className="profiles-page">
      <div className="profiles-header">
        <h1 className="logo">ReminAI</h1>
        <button onClick={handleLogout} className="btn-logout">
          Sign Out
        </button>
      </div>

      <div className="profiles-container">
        <h2 className="profiles-title">Who's journaling?</h2>

        {error && <div className="error-message-center">{error}</div>}

        <div className="profiles-grid">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="profile-card"
              onClick={() => selectProfile(profile)}
            >
              <div className="profile-avatar">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.name} />
                ) : (
                  <div className="profile-avatar-placeholder">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                )}
                {manageMode && (
                  <button
                    className="profile-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProfile(profile.id);
                    }}
                    disabled={loading}
                  >
                    ✕
                  </button>
                )}
              </div>
              <h3 className="profile-name">{profile.name}</h3>
            </div>
          ))}

          {!manageMode &&
            (showAddProfile ? (
              <div className="profile-card add-profile-card">
                <form
                  onSubmit={handleCreateProfile}
                  className="add-profile-form-wrapper"
                >
                  <div className="profile-avatar">
                    <div className="add-profile-icon">+</div>
                  </div>
                  <input
                    type="text"
                    placeholder="Name"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    autoFocus
                    maxLength={20}
                    className="profile-name-input"
                  />
                  <div className="add-profile-buttons">
                    <button
                      type="submit"
                      disabled={loading || !newProfileName.trim()}
                      className="btn-save"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddProfile(false)}
                      className="btn-cancel"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div
                className="profile-card add-profile-card"
                onClick={() => setShowAddProfile(true)}
              >
                <div className="profile-avatar">
                  <div className="add-profile-icon">+</div>
                </div>
                <h3 className="profile-name">Add Profile</h3>
              </div>
            ))}
        </div>

        <div className="profiles-footer">
          <button
            onClick={() => setManageMode(!manageMode)}
            className="btn-manage"
          >
            {manageMode ? "Done" : "Manage Profiles"}
          </button>
        </div>
      </div>
    </div>
  );
}
