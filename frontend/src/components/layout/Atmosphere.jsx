import React from 'react';

export default function Atmosphere() {
  return (
    <>
      <div className="bg-atmosphere" aria-hidden="true" />
      <div className="pillar l" aria-hidden="true">
        <i className="halo" />
        <i className="dim" />
        <i className="bright" />
        <i className="ln a" />
        <i className="ln b" />
      </div>
      <div className="pillar r" aria-hidden="true">
        <i className="halo" />
        <i className="dim" />
        <i className="bright" />
        <i className="ln a" />
        <i className="ln b" />
      </div>
      <div className="grain-atmosphere" aria-hidden="true" />
    </>
  );
}
