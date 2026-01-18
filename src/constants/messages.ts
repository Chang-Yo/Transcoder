export const ERROR_MESSAGES = {
  TRANSCODE_FAILED: "Transcoding failed. Check that ffmpeg is installed and the input file is valid.",
  INVALID_SEGMENT_START: (name: string) => `Invalid segment start time for ${name}`,
  INVALID_SEGMENT_END: (name: string) => `Invalid segment end time for ${name}`,
} as const;
