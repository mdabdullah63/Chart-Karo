const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      default: null,
    },

    avatar: {
      type: String,
      default: null,
    },

    oauth: {
      google: {
        id: {
          type: String,
          default: null,
        },
      },

      github: {
        id: {
          type: String,
          default: null,
        },
      },

      facebook: {
        id: {
          type: String,
          default: null,
        },
      },
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    refreshToken: {
      type: String,
      default: null,
    },

    passwordResetOtp: {
      type: String,
      default: null,
    },

    passwordResetOtpExpires: {
      type: Date,
      default: null,
    },

    passwordResetAttempts: {
      type: Number,
      default: 0,
    },

    passwordResetToken: {
      type: String,
      default: null,
    },

    passwordResetExpires: {
      type: Date,
      default: null,
    },

    lastSeen: {
      type: Date,
      default: null,
    },

    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Never leak secrets/tokens in API responses.
userSchema.set("toJSON", {
  transform(doc, ret) {
    delete ret.password;
    delete ret.refreshToken;
    delete ret.passwordResetOtp;
    delete ret.passwordResetOtpExpires;
    delete ret.passwordResetAttempts;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpires;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
