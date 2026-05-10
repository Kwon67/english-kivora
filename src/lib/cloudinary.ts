/**
 * Utility for Cloudinary dynamic image generation
 */

export function getDynamicPackCoverUrl(packName: string, cloudName?: string) {
  const name = cloudName || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'diuh0ditl'
  
  // Base background image (abstract pattern or gradient)
  // We use a base solid color and overlay text.
  // Transformation:
  // w_600,h_400,c_fill: fixed size
  // b_rgb:1b1c18: background color
  // l_text:Plus Jakarta Sans_40_bold_center:[TEXT]: add text
  // co_rgb:fdfff4: text color
  
  const encodedName = encodeURIComponent(packName.substring(0, 40))
  
  // Note: Using a solid background via 'b_rgb' requires an actual base image or a pixel.
  // Let's use a generic abstract background or just a solid color placeholder if no base image is known.
  // A common trick is using 'blank.png' or any existing small image.
  
  // Alternatively, let's use a nice Unsplash-like abstract base if we don't have one in Cloudinary yet.
  // But since we want to be "pure Cloudinary", we'll assume there is a 'background_base' or similar.
  // Actually, Cloudinary supports 'fetch' from URL too.
  
  // Let's use a simple robust version:
  return `https://res.cloudinary.com/${name}/image/upload/w_600,h_400,c_fill,b_rgb:2d3436/l_text:Arial_40_bold_center:${encodedName},co_rgb:ffffff,w_500,c_fit/v1/sample.jpg`
}
