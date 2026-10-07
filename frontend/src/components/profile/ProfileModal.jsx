import { useEffect, useRef, useState } from "react";
import { Camera, Lock, Trash2 } from "lucide-react";
import { getProfile, updateProfile } from "../../api/authApi";
import { uploadFile } from "../../api/uploadApi";
import { getErrorMessage } from "../../api/axios";
import { useAuth } from "../../context/authContext";
import { useToast } from "../../context/toastContext";
import Avatar from "../common/Avatar";
import Button from "../common/Button";
import Modal from "../common/Modal";

const BIO_LIMIT = 150;
const NAME_LIMIT = 50;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function ProfileForm({ onClose }) {
    const { user, updateUser } = useAuth();
    const toast = useToast();

    const [name, setName] = useState(user?.name || "");
    const [bio, setBio] = useState(user?.bio || "");
    const [newImage, setNewImage] = useState(null); // { file, url }
    const [removeImage, setRemoveImage] = useState(false);
    const [progress, setProgress] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const touched = useRef(false);
    const fileInput = useRef(null);

    // Refresh from the server (as the original profile screen did) unless
    // the user already started typing.
    useEffect(() => {
        let cancelled = false;

        getProfile()
            .then((profile) => {
                if (cancelled) return;

                updateUser({
                    name: profile.name,
                    bio: profile.bio,
                    profileImage: profile.profileImage
                });

                if (!touched.current) {
                    setName(profile.name || "");
                    setBio(profile.bio || "");
                }
            })
            .catch(() => {});

        return () => {
            cancelled = true;
        };
    }, [updateUser]);

    // Release the preview URL when replaced / unmounted
    useEffect(
        () => () => {
            if (newImage) URL.revokeObjectURL(newImage.url);
        },
        [newImage]
    );

    const previewUser = {
        name,
        profileImage: removeImage ? null : user?.profileImage
    };

    const dirty =
        name.trim() !== (user?.name || "") ||
        bio.trim() !== (user?.bio || "") ||
        Boolean(newImage) ||
        removeImage;

    const handleImage = (event) => {
        const file = event.target.files?.[0];

        event.target.value = "";

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("Please choose an image file.");
            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            setError("Profile photo must be smaller than 5 MB.");
            return;
        }

        setError("");
        setRemoveImage(false);
        setNewImage({ file, url: URL.createObjectURL(file) });
    };

    const handleSave = async (event) => {
        event.preventDefault();

        if (!name.trim()) {
            setError("Name can't be empty.");
            return;
        }

        setError("");
        setSaving(true);

        try {
            let profileImage = removeImage ? null : user?.profileImage || null;

            if (newImage) {
                const uploaded = await uploadFile(newImage.file, setProgress);
                profileImage = uploaded?.file?.url || profileImage;
            }

            const response = await updateProfile({
                name: name.trim(),
                bio: bio.trim(),
                profileImage
            });

            updateUser(response.user);
            toast.success("Profile updated");
            onClose();
        } catch (saveError) {
            setError(getErrorMessage(saveError, "Couldn't update your profile."));
            setSaving(false);
            setProgress(null);
        }
    };

    return (
        <form className="profile-form" onSubmit={handleSave}>
            <div className="profile-form__photo">
                <div className="profile-form__avatar">
                    <Avatar
                        user={previewUser}
                        src={newImage ? newImage.url : removeImage ? null : undefined}
                        size="xxl"
                    />
                    <button
                        type="button"
                        className="profile-form__camera"
                        onClick={() => fileInput.current?.click()}
                        aria-label="Change profile photo"
                        disabled={saving}
                    >
                        <Camera size={16} />
                    </button>
                    <input
                        ref={fileInput}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handleImage}
                    />
                </div>

                <div className="profile-form__photo-actions">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => fileInput.current?.click()}
                        disabled={saving}
                    >
                        Change photo
                    </Button>

                    {(user?.profileImage || newImage) && !removeImage && (
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
                            disabled={saving}
                            onClick={() => {
                                setNewImage(null);
                                setRemoveImage(true);
                            }}
                        >
                            Remove
                        </Button>
                    )}
                    <span className="field__hint">JPG, PNG or GIF · up to 5 MB</span>
                </div>
            </div>

            <label className="field">
                <span className="field__label">Name</span>
                <input
                    data-autofocus
                    className="field__input"
                    value={name}
                    maxLength={NAME_LIMIT}
                    onChange={(event) => {
                        touched.current = true;
                        setName(event.target.value);
                    }}
                    placeholder="Your name"
                    disabled={saving}
                />
            </label>

            <label className="field">
                <span className="field__label">
                    Email <Lock size={12} aria-hidden="true" />
                </span>
                <input
                    className="field__input"
                    value={user?.email || ""}
                    disabled
                    readOnly
                />
            </label>

            <label className="field">
                <span className="field__label">
                    Bio
                    <span className="field__counter">
                        {bio.length}/{BIO_LIMIT}
                    </span>
                </span>
                <textarea
                    className="field__input field__textarea"
                    value={bio}
                    maxLength={BIO_LIMIT}
                    rows={3}
                    onChange={(event) => {
                        touched.current = true;
                        setBio(event.target.value);
                    }}
                    placeholder="Tell people a little about yourself"
                    disabled={saving}
                />
            </label>

            {error && (
                <p className="form-error" role="alert">
                    {error}
                </p>
            )}

            <div className="profile-form__footer">
                <Button variant="secondary" onClick={onClose} disabled={saving}>
                    Cancel
                </Button>
                <Button type="submit" loading={saving} disabled={!dirty}>
                    {saving && progress !== null && progress < 100
                        ? `Uploading ${progress}%`
                        : "Save changes"}
                </Button>
            </div>
        </form>
    );
}

export default function ProfileModal({ open, onClose }) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Edit profile"
            description="This is how other people see you in Relay."
        >
            <ProfileForm onClose={onClose} />
        </Modal>
    );
}
