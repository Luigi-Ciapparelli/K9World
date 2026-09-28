import type { AnchorHTMLAttributes, MouseEvent } from 'react';
import { useRouter } from '../lib/RouterContext';

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: string };

/** Real links keep keyboard, copy-link and open-in-new-tab behavior. */
export function RouteLink({ to, onClick, ...props }: Props) {
  const { navigate } = useRouter();
  const follow = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || props.target === '_blank') return;
    event.preventDefault();
    navigate(to);
  };
  return <a {...props} href={`#${to}`} onClick={follow} />;
}
