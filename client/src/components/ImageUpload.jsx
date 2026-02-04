import React, { useState, useRef } from 'react';
import { Image, X, Upload } from 'lucide-react';

function ImageUpload({ onImageMessage, disabled = false }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [question, setQuestion] = useState('');
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      setShowModal(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedImage && question.trim()) {
      onImageMessage(selectedImage, question.trim());
      resetForm();
    }
  };

  const resetForm = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setQuestion('');
    setShowModal(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <>
      <button
        onClick={openFileDialog}
        disabled={disabled}
        className="btn-secondary flex items-center justify-center w-12 h-12 rounded-xl"
        aria-label="Upload image"
      >
        <Image className="w-5 h-5" />
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />

      {/* Image Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Ask about this image
              </h3>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Image Preview */}
              {imagePreview && (
                <div className="mb-6">
                  <img
                    src={imagePreview}
                    alt="Selected image"
                    className="w-full max-h-64 object-contain rounded-lg border border-gray-200 dark:border-dark-700"
                  />
                  <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {selectedImage?.name} ({(selectedImage?.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                </div>
              )}

              {/* Question Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="question" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    What would you like to know about this image?
                  </label>
                  <textarea
                    id="question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Describe what you see, analyze the content, explain what's happening..."
                    className="input-field resize-none h-24"
                    required
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!question.trim()}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Send Image</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ImageUpload;