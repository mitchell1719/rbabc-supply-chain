import { Directive, ElementRef, Input, OnInit } from '@angular/core';

@Directive({
  selector: 'a[appUtmLink]',
  standalone: true,
})
export class UtmLinkDirective implements OnInit {
  @Input() utmSource = 'rbabc-supply-chain-app';
  @Input() utmMedium = 'internal-link';
  @Input() utmCampaign = 'app-referral';

  constructor(private element: ElementRef<HTMLAnchorElement>) {}

  ngOnInit(): void {
    const anchor = this.element.nativeElement;
    const href = anchor.getAttribute('href');

    if (!href) return;

    let url: URL;

    try {
      url = new URL(href, window.location.href);
    } catch {
      return;
    }

    const isExternal = url.origin !== window.location.origin;

    if (!isExternal) return;

    if (!url.searchParams.has('utm_source')) {
      url.searchParams.set('utm_source', this.utmSource);
    }

    if (!url.searchParams.has('utm_medium')) {
      url.searchParams.set('utm_medium', this.utmMedium);
    }

    if (!url.searchParams.has('utm_campaign')) {
      url.searchParams.set('utm_campaign', this.utmCampaign);
    }

    anchor.setAttribute('href', url.toString());
    anchor.setAttribute('rel', 'noopener noreferrer');

    if (!anchor.hasAttribute('target')) {
      anchor.setAttribute('target', '_blank');
    }
  }
}
