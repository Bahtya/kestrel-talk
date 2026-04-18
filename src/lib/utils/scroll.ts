export function scrollToBottom(element: HTMLElement, smooth = true): void {
  element.scrollTo({
    top: element.scrollHeight,
    behavior: smooth ? 'smooth' : 'instant',
  });
}

export function isNearBottom(element: HTMLElement, threshold = 100): boolean {
  return element.scrollHeight - element.scrollTop - element.clientHeight < threshold;
}
