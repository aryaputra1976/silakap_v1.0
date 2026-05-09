export function ok<T>(data: T, message = 'OK') {
  return {
    success: true,
    message,
    data,
  };
}
