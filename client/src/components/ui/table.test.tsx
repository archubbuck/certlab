import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from './table';

describe('Table component snapshots', () => {
  it('renders complete Table structure', () => {
    const { container } = render(
      <Table>
        <TableCaption>A list of items</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Header 1</TableHead>
            <TableHead>Header 2</TableHead>
            <TableHead>Header 3</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Row 1, Cell 1</TableCell>
            <TableCell>Row 1, Cell 2</TableCell>
            <TableCell>Row 1, Cell 3</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Row 2, Cell 1</TableCell>
            <TableCell>Row 2, Cell 2</TableCell>
            <TableCell>Row 2, Cell 3</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Footer</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders Table with custom className', () => {
    const { container } = render(
      <Table className="custom-table">
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders minimal Table', () => {
    const { container } = render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Single Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
