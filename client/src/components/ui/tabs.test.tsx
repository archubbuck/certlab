import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';

describe('Tabs component snapshots', () => {
  it('renders Tabs with multiple tabs', () => {
    const { container } = render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          <TabsTrigger value="tab3">Tab 3</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
        <TabsContent value="tab3">Content 3</TabsContent>
      </Tabs>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders TabsList with custom className', () => {
    const { container } = render(
      <Tabs defaultValue="tab1">
        <TabsList className="custom-tabs">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
      </Tabs>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders disabled TabsTrigger', () => {
    const { container } = render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1" disabled>
            Disabled Tab
          </TabsTrigger>
        </TabsList>
      </Tabs>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
