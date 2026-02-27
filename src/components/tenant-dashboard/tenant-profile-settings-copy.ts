export const buildTenantProfileCopy = (isEnglish: boolean) => ({
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
  profileUpdated:
    isEnglish ? "Profile updated successfully." : "Profil berhasil diperbarui.",
  updateFailed: isEnglish ? "Failed to update profile." : "Gagal memperbarui profil.",
  nameRequired: isEnglish ? "Tenant name is required." : "Nama tenant wajib diisi.",
  noChanges:
    isEnglish ? "No changes to save yet." : "Belum ada perubahan untuk disimpan.",
  invalidEmail: isEnglish ? "Invalid email format." : "Format email tidak valid.",
  resetFailed:
    isEnglish ? "Failed to send password reset." : "Gagal mengirim atur ulang password.",
  resendFailed: isEnglish ? "Failed to send verification." : "Gagal mengirim verifikasi.",
  profileTag: isEnglish ? "Tenant Profile" : "Profil Tenant",
  profileTitle:
    isEnglish
      ? "Manage profile and account security"
      : "Kelola profil dan keamanan akun",
  profileSubtitle:
    isEnglish
      ? "Update tenant profile data, photo, email, and password."
      : "Perbarui data profil tenant, foto, email, dan password.",
  changesNotSaved:
    isEnglish ? "You have unsaved changes." : "Ada perubahan yang belum disimpan.",
  changesSaved: isEnglish ? "All changes are saved." : "Semua perubahan sudah tersimpan.",
  emailStatus: isEnglish ? "Email Status" : "Status Email",
  verified: isEnglish ? "Verified" : "Terverifikasi",
  unverified: isEnglish ? "Unverified" : "Belum terverifikasi",
  emailNotVerified:
    isEnglish
      ? "Email is not verified. Please verify again."
      : "Email belum terverifikasi. Silakan verifikasi ulang.",
  personalData: isEnglish ? "Tenant Data" : "Data Tenant",
  tenantName: isEnglish ? "Tenant Name" : "Nama Tenant",
  companyName: isEnglish ? "Company Name" : "Nama Perusahaan",
  profilePhoto: isEnglish ? "Profile Photo" : "Foto Profil",
  uploadPhoto: isEnglish ? "Upload New Photo" : "Unggah Foto Baru",
  uploadingPhoto: isEnglish ? "Uploading photo..." : "Mengunggah foto...",
  autoSaveNameHint:
    isEnglish
      ? "Name changes are saved automatically after you finish editing."
      : "Perubahan nama akan tersimpan otomatis setelah selesai diedit.",
  saving: isEnglish ? "Saving..." : "Menyimpan...",
  updateEmail: isEnglish ? "Update Email" : "Perbarui Email",
  updateEmailHint:
    isEnglish
      ? "Changing email requires re-verification."
      : "Mengubah email membutuhkan verifikasi ulang.",
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
  securityHint:
    isEnglish
      ? "We will send a secure reset link to your current email."
      : "Kami akan mengirim tautan reset yang aman ke email Anda saat ini.",
  defaultCompany: isEnglish ? "BookIn Partner" : "Mitra BookIn",
});

export type TenantProfileCopy = ReturnType<typeof buildTenantProfileCopy>;
