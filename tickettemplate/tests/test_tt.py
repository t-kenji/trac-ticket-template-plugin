# -*- coding: utf-8 -*-
#
# Copyright (C) 2008-2013 Richard Liao <richard.liao.i@gmail.com>
# All rights reserved.
#
# This software is licensed as described in the file COPYING, which
# you should have received as part of this distribution.
#

import unittest

from trac.core import *
from trac.test import EnvironmentStub, Mock

from tickettemplate.utils import SYSTEM_USER
from tickettemplate.model import TT_Template
import tickettemplate.ttadmin as ttadmin


class TicketTemplateTestCase(unittest.TestCase):

    def setUp(self):
        self.env = EnvironmentStub(enable=['tickettemplate'])
        self.tt = ttadmin.TicketTemplateModule(self.env)
        self.tt.upgrade_environment()

    def tearDown(self):
        self.env.shutdown()  # really closes the db connections

    def test_match_request(self):
        req = Mock(path_info='/tt')
        self.assertEqual(True, self.tt.match_request(req))

        req = Mock(path_info='/something')
        self.assertEqual(False, self.tt.match_request(req))

    def test_load_template_text(self):
        templates = [
            ("default2", "default text"),
            ("defect", "defect text"),
            ("enhancement", "enhancement text"),
            ("task", "task text"),
        ]
        self.tt._insert_templates(templates)
        for tt_name, tt_text in templates:
            self.assertEqual(tt_text, self.tt._loadTemplateText(tt_name))


def suite():
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(TicketTemplateTestCase, 'test'))
    return suite


if __name__ == '__main__':
    unittest.main()
