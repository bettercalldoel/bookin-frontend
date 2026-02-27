export const buildUserProfileCopy = (locale: string) => {
  const isEnglish = locale === "en";
  return {
    unauthorized: "Unauthorized.",
    uploadFailed: isEnglish ? "Avatar upload failed." : "Upload avatar gagal.",
    invalidAvatarFormat:
      isEnglish
        ? "Photo format must be .jpg, .jpeg, .png, or .gif."
        : "Format foto harus .jpg, .jpeg, .png, atau .gif.",
    invalidAvatarSize:
      isEnglish ? "Maximum photo size is 1MB." : "Ukuran foto maksimal 1MB.",
    avatarUploaded:
      isEnglish ? "Profile photo uploaded successfully." : "Foto profil berhasil diunggah.",
    updateFailed:
      isEnglish ? "Failed to update profile." : "Gagal memperbarui.",
    invalidEmail: isEnglish ? "Invalid email format." : "Format email tidak valid.",
    resetFailed:
      isEnglish
        ? "Failed to send password reset."
        : "Gagal mengirim atur ulang password.",
    resendFailed: isEnglish ? "Failed to send." : "Gagal mengirim.",
    profileHeader: isEnglish ? "User Profile" : "Profil Pengguna",
    profileTitle:
      isEnglish
        ? "Manage profile and account security"
        : "Kelola profil dan keamanan akun",
    backHome: isEnglish ? "Back to Home" : "Kembali ke Beranda",
    emailStatus: isEnglish ? "Email Status" : "Status Email",
    verified: isEnglish ? "Verified" : "Terverifikasi",
    unverified: isEnglish ? "Unverified" : "Belum terverifikasi",
    emailNotVerified:
      isEnglish
        ? "Email is not verified. Please verify again."
        : "Email belum terverifikasi. Silakan verifikasi ulang.",
    personalData: isEnglish ? "Personal Data" : "Data Personal",
    fullName: isEnglish ? "Full Name" : "Nama Lengkap",
    profilePhoto: isEnglish ? "Profile Photo" : "Foto Profil",
    choosePhoto: isEnglish ? "Choose Photo" : "Pilih Foto",
    uploadingPhoto: isEnglish ? "Uploading photo..." : "Mengunggah foto...",
    avatarHint:
      isEnglish
        ? "Format: jpg, jpeg, png, gif. Max 1MB."
        : "Format: jpg, jpeg, png, gif. Maksimal 1MB.",
    saving: isEnglish ? "Saving..." : "Menyimpan...",
    saveProfile: isEnglish ? "Save Profile" : "Simpan Profil",
    updateEmail: isEnglish ? "Update Email" : "Perbarui Email",
    resendVerification: isEnglish ? "Resend verification" : "Verifikasi ulang",
    sending: isEnglish ? "Sending..." : "Mengirim...",
    updatePassword: isEnglish ? "Update Password" : "Perbarui Password",
    googleAccountHint:
      isEnglish
        ? "This account signs in with Google. Password reset is only available for email/password accounts."
        : "Akun ini masuk melalui Google. Atur ulang password hanya tersedia untuk akun yang dibuat dengan email dan password.",
    sendResetLink:
      isEnglish
        ? "Send Password Reset Link to Email"
        : "Kirim Link Atur Ulang ke Email",
  };
};

export type UserProfileCopy = ReturnType<typeof buildUserProfileCopy>;
